import { Layout } from "@/consts/VisualisationParameters";
import { getUniquePredGroups } from "@utils/Graph/orGroups";
import { getYOffsetForOrGroup } from "@utils/Graph/offsets";
import { Choices, CodeToCoordinates, Course, Details, EdgeOffsets, Order, PositionsToCode, RealPositions} from "@/types/subjects";

export function getPositions(details: Details, order: Order, choices: Choices) : [RealPositions, number, number] {
    let maxX = 0;
    let maxY = 0;
    let semestersCount = Object.keys(order).length;
    // const [subtreeSizes, subtreeDepths] = getSubtreeSizes(details);
    
    const codeToCoordinates: CodeToCoordinates = {};
    const realPositions: RealPositions = {}
    const positionsToCode: PositionsToCode = Array.from({ length: semestersCount }, () => []);

    Object.values(order).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            let positionIndex = 0;
            const code = "code" in subject ? subject.code : subject.choice;
            if (codeToCoordinates[code]
                || !details[code]
                || details[code].semester == null
            ) {
                return;
            }

            let placed = false;
            while (!placed) {
                if (getTreePositions(details, semesterIndex, 
                                    positionIndex, code, codeToCoordinates,
                                    positionsToCode, choices)) {
                    placed = true;
                }
                positionIndex++;
            }
        })
    })

    Object.entries(codeToCoordinates).forEach(([code, [coordX, coordY]]) => {
        const x = coordX * Layout.columnWidth  + (Layout.columnWidth - Layout.subjectWidth - 2 * Layout.subjectPadding) / 2;
        const y = coordY * Layout.rowHeight + (Layout.rowHeight - Layout.subjectHeight - 2 * Layout.subjectPadding) / 2;
        realPositions[code] = { x, y };

        // adding one, because the outer edge's real coordinate is needed
        if ((coordX + 1) * Layout.columnWidth > maxX) {maxX = (coordX + 1) * Layout.columnWidth;}
        if ((coordY + 1) * Layout.rowHeight > maxY) {maxY = (coordY + 1) * Layout.rowHeight;}
    })
    return [realPositions, maxX, maxY];
}


export function getTreePositions(details: Details, semesterIndex: number, 
                          positionIndex: number, code: string, codeToCoordinates: CodeToCoordinates, 
                          positionsToCode: PositionsToCode, choices: Choices) : boolean {
    // Position already occupied
    if ((positionsToCode[semesterIndex]
        && positionsToCode[semesterIndex][positionIndex])) {
            return false;
    }

    // Already drew this node
    if (codeToCoordinates[code]) {
        return true;
    }

    let succs = details[code].successors;
    let currentY = positionIndex;
    for (let i = 0; i < succs.length; i++) {
        if (!details[succs[i].code] || details[succs[i].code].semester == null) { continue; }   // successor not in data, move to another one
        if (!getTreePositions(details, semesterIndex + 1,
                                 currentY, succs[i].code, codeToCoordinates,
                                 positionsToCode, choices)) {
            return false;
        }
        currentY += 1;
    }
    codeToCoordinates[code] = [semesterIndex, positionIndex];
    positionsToCode[semesterIndex][positionIndex] = code;
    return true;
}


export function getOrGatesPositionsForSubject(code: string, course: Course,
        processedSubjects: Details, edgeYOffsets: EdgeOffsets) : Array<number> {
    let hasOrGate = course.predecessors.some(pred => pred.groups.length > 0) &&
        course.predecessors
            .some(pred => pred.groups
            .some(g => g
                .filter(s => processedSubjects[s]).length > 1));

    if (!hasOrGate) { return []; }
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
