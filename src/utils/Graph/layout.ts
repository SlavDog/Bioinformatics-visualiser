import { Layout } from "@/consts/VisualisationParameters";
import { getUniquePredGroups } from "@utils/Graph/orGroups";
import { getYOffsetForOrGroup } from "@utils/Graph/offsets";
import { Choices, CodeToCoordinates, Course, Details, EdgeOffsets, PositionsToCode, RealPositions, Spec} from "@/types/subjects";

export function getPositions(details: Details, spec: Spec, selectedSpecialization: string) : [RealPositions, number, number] {
    let semestersCount = Object.keys(spec[selectedSpecialization].plan).length;
    const codeToCoordinates: CodeToCoordinates = {};
    const positionsToCode: PositionsToCode = Array.from({ length: semestersCount }, () => []);

    Object.values(spec[selectedSpecialization].plan).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            const tempCodeToCoordinates = {};
            const tempPositionsToCode = Array.from({ length: semestersCount }, () => []);
            let positionIndex = 0;
            const code = "code" in subject ? subject.code : subject.choice;
            
            if (codeToCoordinates[code]
                || !details[code]
                || details[code].semester == null
            ) {
                return;
            }

            while (!getTreePositions(details, semesterIndex, 
                                     positionIndex, code, codeToCoordinates,
                                     positionsToCode, tempCodeToCoordinates,
                                     tempPositionsToCode)
                    || !addMissedPredecessorsPositions(details, positionsToCode, tempCodeToCoordinates, tempPositionsToCode, selectedSpecialization)) {
                positionIndex++;
            }
            

            Object.assign(codeToCoordinates, tempCodeToCoordinates);
            tempPositionsToCode.forEach((semesterArray, semesterIdx) => {
                semesterArray.forEach((code, positionIdx) => {
                    positionsToCode[semesterIdx][positionIdx] = code;
                })
            })
        });
    })

    return getRealPositionsAndBoundaries(codeToCoordinates);
}


function getConnectedComponent(startCode: string, details: Details): string[] {
    const visited: Set<string> = new Set();
    const queue = [startCode];
    
    visited.add(startCode);
    while (queue.length > 0) {
        const currentCode = queue.shift();
        if (!currentCode) continue;
        const course = details[currentCode];

        const succs = (course.successors ?? []).map(s => s.code);
        const preds = (course.predecessors ?? []).map(p => p.code);
        const neighbors = [...succs, ...preds];

        for (const neighbor of neighbors) {
            if (neighbor && !visited.has(neighbor) && details[neighbor]) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return Array.from(visited);
}


function addMissedPredecessorsPositions(details: Details, positionsToCode: PositionsToCode, tempCodeToCoordinates: CodeToCoordinates, tempPositionsToCode: PositionsToCode, selectedSpecialization: string) : boolean {
    console.log(getConnectedComponent(Object.keys(tempCodeToCoordinates)[0], details))
    const missedCodes: string[] = getConnectedComponent(Object.keys(tempCodeToCoordinates)[0], details)
        .filter(code => !tempCodeToCoordinates[code] && details[code].semester != null);
    missedCodes.forEach(code => {
        let currentSemester = details[code]?.semester;
        if (currentSemester == null) { return; }
        let positionIndex =  tempPositionsToCode[currentSemester - 1].length;
        while (tempPositionsToCode[currentSemester - 1][positionIndex]) {
            if (positionsToCode[currentSemester - 1] && positionsToCode[currentSemester - 1][positionIndex]) {
                return false;
            }
            positionIndex++;
        }
        tempCodeToCoordinates[code] = {x: currentSemester - 1, y: positionIndex};
        tempPositionsToCode[currentSemester - 1][positionIndex] = code;
    })
    return true;
}


function getRealPositionsAndBoundaries(codeToCoordinates: CodeToCoordinates) : [RealPositions, number, number] {
    const realPositions: RealPositions = {};
    let maxX = 0;
    let maxY = 0;
    Object.entries(codeToCoordinates).forEach(([code, {x: coordX, y: coordY}]) => {
        const x = coordX * Layout.columnWidth  + (Layout.columnWidth - Layout.subjectWidth - 2 * Layout.subjectPadding) / 2;
        const y = coordY * Layout.rowHeight + (Layout.rowHeight - Layout.subjectHeight - 2 * Layout.subjectPadding) / 2;
        realPositions[code] = { x, y };

        // adding one, because the outer edge's real coordinate is required for size calculation
        if ((coordX + 1) * Layout.columnWidth > maxX) {maxX = (coordX + 1) * Layout.columnWidth;}
        if ((coordY + 1) * Layout.rowHeight > maxY) {maxY = (coordY + 1) * Layout.rowHeight;}
    })
    return [realPositions, maxX, maxY];
}


export function getTreePositions(details: Details, semesterIndex: number, 
                                 positionIndex: number, code: string,
                                 codeToCoordinates: CodeToCoordinates, 
                                 positionsToCode: PositionsToCode, tempCodeToCoordinates: CodeToCoordinates, tempPositionsToCode: PositionsToCode) : boolean {
    // Position already occupied
    if ((positionsToCode[semesterIndex]
        && positionsToCode[semesterIndex][positionIndex])) {
            return false;
    }

    // Node already placed or semester doesn't match the one in data
    if (codeToCoordinates[code] 
            || (details[code].semester != null 
                    && details[code].semester != semesterIndex + 1 && details[code].predecessors.length > 0)) {
        return true;
    }

    let succs = details[code].successors;
    let currentY = positionIndex;
    for (let i = 0; i < succs.length; i++) {
        if (!details[succs[i].code] || details[succs[i].code].semester == null) { continue; }   // successor not in data, move to another one
        if (!getTreePositions(details, semesterIndex + 1,
                                 currentY, succs[i].code, codeToCoordinates,
                                 positionsToCode, tempCodeToCoordinates, tempPositionsToCode)) {
            return false;
        }
        currentY += 1;
    }
    tempCodeToCoordinates[code] = {x: semesterIndex, y: positionIndex};
    tempPositionsToCode[semesterIndex][positionIndex] = code;
    return true;
}


function hasOrGate(course: Course, processedSubjects: Details) : boolean {
    return course.predecessors.some(pred => pred.groups.length > 0) &&
        course.predecessors
            .some(pred => pred.groups
            .some(g => g
                .filter(s => processedSubjects[s]).length > 1));
}


export function getOrGatesYOffsetsForSubject(code: string, course: Course,
        processedSubjects: Details, edgeYOffsets: EdgeOffsets) : Array<number> {
    if (!hasOrGate(course, processedSubjects)) { return []; }

    return getUniquePredGroups(course)
        .filter(group => group.length > 1)
        .map(group => {
            let yOffset = getYOffsetForOrGroup(edgeYOffsets, group, code);
            if (yOffset != undefined) {
                return yOffset + Layout.subjectHeight / 2 + 15;
            }
        })
        .filter(element => element != undefined);
}


export function getAllOrGatesPositions(details: Details, positions: RealPositions, edgeYOffsets: EdgeOffsets) : Array<{x: number, y: number}> {
    let orGatesPositions: Array<{x: number, y: number}> = [];
    Object.entries(details).forEach(([code, course]) => {
        if (!hasOrGate(course, details)) { return; }
        const x = positions[code].x;
        const yOffsets = getOrGatesYOffsetsForSubject(code, course, details, edgeYOffsets);

        yOffsets.forEach(yOffset => {
            orGatesPositions.push({x, y: yOffset + positions[code].y - 15});
        })
    })
    return orGatesPositions;
}