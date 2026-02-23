import { Layout } from "@/consts/VisualisationParameters";
import { getUniquePredGroups } from "@utils/Graph/orGroups";
import { getYOffsetForOrGroup } from "@utils/Graph/offsets";
import { CodeToCoordinates, Course, Details, EdgeOffsets, OrderSubject, PositionsToCode, RealPositions, Spec, Specialization} from "@/types/subjects";

export function getPositions(details: Details, spec: Spec, selectedSpecialization: string, codesToSem: Record<string, number>) : [RealPositions, number, number] {
    const plan = spec[selectedSpecialization].plan;
    let semestersCount = Object.keys(plan).length;
    const codeToCoordinates: CodeToCoordinates = {};
    const positionsToCode: PositionsToCode = Array.from({ length: semestersCount }, () => []);

    const currentSpecializationCodes = new Set(Object.values(plan)
                                            .flat()
                                            .map(subject => getSubjectCode(subject)));

    Object.values(plan).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            let code = getSubjectCode(subject);

            if (codeToCoordinates[code]
                || !details[code]
                || !currentSpecializationCodes.has(code)
            ) {
                return;
            }
            
            console.log("Placing", code);
            const placement = findValidPlacement(
                code, semesterIndex, semestersCount, details, 
                codeToCoordinates, positionsToCode, currentSpecializationCodes,
                selectedSpecialization, codesToSem
            );

            if (placement) {
                mergePlacements(codeToCoordinates, positionsToCode, placement);
            }
        });
    })
    return getRealPositionsAndBoundaries(codeToCoordinates);
}


function mergePlacements(destCoords: CodeToCoordinates, destPos: PositionsToCode, src: [CodeToCoordinates, PositionsToCode]) {
    const [srcCoords, srcPos] = src;
    Object.assign(destCoords, srcCoords);
    srcPos.forEach((semesterArray, semesterIdx) => {
        semesterArray.forEach((code, positionIdx) => {
            if (code) destPos[semesterIdx][positionIdx] = code;
        });
    });
}


function findValidPlacement(code: string, semesterIndex: number, semestersCount: number, details: Details,
                            globalCoords: CodeToCoordinates, globalPos: PositionsToCode,
                            specCodes: Set<string>, specName: string, codesToSem: Record<string, number>) : [CodeToCoordinates, PositionsToCode] | null {
    for (let positionIndex = 0; positionIndex < 20; positionIndex++) {
        let tempCoords = {};
        let tempPos = Array.from({ length: semestersCount }, () => []);

        const isTreeOk = getTreePositions(details, semesterIndex, positionIndex, code,
                                          globalCoords, globalPos, tempCoords, tempPos, specCodes, codesToSem);
        const arePredsOk = addMissedPredecessorsPositions(details, globalCoords, globalPos, 
                                                          tempCoords, tempPos, specName, codesToSem);

        if (isTreeOk && arePredsOk) {
            return [tempCoords, tempPos];
        }
    }
    return null;
}


function getSubjectCode(s: OrderSubject) : string {
    return ("code" in s ? s.code : s.choice)
};


export function getReachableCodes(startCode: string, details: Details, searchPredecessorEdges: boolean = true): string[] {
    if (details[startCode] == null) {return [];}
    const visited: Set<string> = new Set();
    const queue = [startCode];
    
    visited.add(startCode);
    while (queue.length > 0) {
        const currentCode = queue.shift();
        if (!currentCode) continue;
        const course = details[currentCode];

        const succs = (course.successors ?? []).map(s => s.code);
        const preds = searchPredecessorEdges ? (course.predecessors ?? []).map(p => p.code) : [];
        const neighbours = [...succs, ...preds];

        neighbours.forEach((neighbour) => {
            if (neighbour && !visited.has(neighbour) && details[neighbour]) {
                visited.add(neighbour);
                queue.push(neighbour);
            }
        });
    }
    return Array.from(visited);
}


function addMissedPredecessorsPositions(details: Details, codesToCoordinates: CodeToCoordinates, positionsToCode: PositionsToCode, tempCodeToCoordinates: CodeToCoordinates, tempPositionsToCode: PositionsToCode, selectedSpecialization: string, codesToSem: Record<string, number>) : boolean {
    const missedCodes: string[] = getReachableCodes(Object.keys(tempCodeToCoordinates)[0], details)
        .filter(code => !tempCodeToCoordinates[code] && !codesToCoordinates[code] && codesToSem[code] != null)

    for (let i = 0; i < missedCodes.length; i++) {
        const code = missedCodes[i];
        let currentSemester = codesToSem[code];
        const semesterIndex = currentSemester! - 1; // can't be null because of the filtering above

        const currentSemesterData = positionsToCode[semesterIndex];
        const tempSemesterData = tempPositionsToCode[semesterIndex];
        let positionIndex =  tempPositionsToCode[semesterIndex].length;

        if (!currentSemesterData || currentSemesterData[positionIndex]) {
            return false;
        }

        while (tempSemesterData[positionIndex]) {
            positionIndex++;
            if (currentSemesterData[positionIndex]) {
                return false;
            }
        }
        tempCodeToCoordinates[code] = {x: semesterIndex, y: positionIndex};
        tempPositionsToCode[semesterIndex][positionIndex] = code;
    }
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
                                 positionsToCode: PositionsToCode, 
                                 tempCodeToCoordinates: CodeToCoordinates, 
                                 tempPositionsToCode: PositionsToCode,
                                 currentSpecializationCodes: Set<string>,
                                 codesToSem: Record<string, number>
                             ) : boolean {
                                    
    
    // Position already occupied
    if ((positionsToCode[semesterIndex]?.[positionIndex])) {
            return false;
    }

    // Node already placed or semester doesn't match the one in data
    if (codeToCoordinates[code] || tempCodeToCoordinates[code] 
            || (codesToSem[code] != null 
                && codesToSem[code] != semesterIndex + 1
                && details[code].predecessors.length > 0)
            || !currentSpecializationCodes.has(code)) {
        return true;
    }

    let succs = details[code].successors;
    let nextAvailableY = positionIndex;
    for (let i = 0; i < succs.length; i++) {
        if (!details[succs[i].code] || codesToSem[succs[i].code] == null) { continue; }   // successor not in data, move to another one
        if (!getTreePositions(details, semesterIndex + 1,
                              nextAvailableY, succs[i].code, codeToCoordinates,
                              positionsToCode, tempCodeToCoordinates, tempPositionsToCode, currentSpecializationCodes, codesToSem)) {
            return false;
        }
        nextAvailableY += 1;
    }
    tempCodeToCoordinates[code] = {x: semesterIndex, y: positionIndex};
    tempPositionsToCode[semesterIndex][positionIndex] = code;
    return true;
}


function hasOrGate(code: string, course: Course, processedSubjects: Details, codesToSem: Record<string, number>) : boolean {
    return course.predecessors.some(pred => pred.groups.length > 0)
        && course.predecessors
            .some(pred => pred.groups
            .some(g => g
                .filter(s => codesToSem[s] != null 
                            && codesToSem[s] < (codesToSem[code] ?? 0))
                .filter(s => processedSubjects[s]).length > 1));
}


export function getOrGatesYOffsetsForSubject(code: string, course: Course,
        processedSubjects: Details, edgeYOffsets: EdgeOffsets, codesToSem: Record<string, number>) : Array<number> {
    if (!hasOrGate(code, course, processedSubjects, codesToSem)) { return []; }

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


export function getAllOrGatesPositions(details: Details, specialization: Specialization, positions: RealPositions, edgeYOffsets: EdgeOffsets, codesToSem: Record<string, number>) : Array<{x: number, y: number}> {
    let orGatesPositions: Array<{x: number, y: number}> = [];
    const specializationCodes = new Set(Object.values(specialization.plan).flat().map(subject => getSubjectCode(subject)));
    Object.entries(details).forEach(([code, course]) => {
        if (!specializationCodes.has(code) || !hasOrGate(code,course, details, codesToSem)) { return; }
        const x = positions[code].x;
        const yOffsets = getOrGatesYOffsetsForSubject(code, course, details, edgeYOffsets, codesToSem);

        yOffsets.forEach(yOffset => {
            orGatesPositions.push({x, y: yOffset + positions[code].y - 15});
        })
    })
    return orGatesPositions;
}