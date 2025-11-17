import { isInSomeChoice } from "@utils/Graph/choiceNodes";
import { Layout } from "@/consts/VisualisationParameters";
import { getUniquePredGroups } from "@utils/Graph/orGroups";
import { getYOffsetForOrGroup } from "@utils/Graph/offsets";


export function getSubtreeSizes(data) {
    const visited = new Set();
    const resultSizes = {};
    const resultDepths = {};
    Object.keys(data).forEach((code) => {
        if (!visited.has(code)) {
            getSubtreeSizesAux(data, visited, code, resultSizes, resultDepths);
        }
    });
    return [resultSizes, resultDepths];
}


export function getSubtreeSizesAux(data, visited, current, resultSizes, resultDepths) {
    visited[current] = true;
    if (data[current].successors.length == 0) {
        resultSizes[current] = 1;
        resultDepths[current] = 1;
        return [1, 1];
    }
    let sum = 0;
    let maxDepth = 0;
    data[current].successors.forEach((succCode) => {
        if (data[succCode].semester != "null") {
            const [depth, size] = getSubtreeSizesAux(data, visited, succCode,
                                                     resultSizes, resultDepths);
            sum += size;
            if (depth > maxDepth) {maxDepth = depth;}
        }
    });
    resultSizes[current] = sum + 1;
    resultDepths[current] = maxDepth + 1;
    return [maxDepth + 1, sum + 1];
}


export function getPositions(newSubjectInfoData, subjectOrderData, choices) {
    let maxX = 0;
    let maxY = 0;
    let semestersCount = Object.keys(subjectOrderData).length;
    // const [subtreeSizes, subtreeDepths] = getSubtreeSizes(newSubjectInfoData);
    
    const codeToPositions = {};
    const positionsToCode = Array.from({ length: semestersCount }, () => []);

    Object.values(subjectOrderData).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            let positionIndex = 0;
            const code = subject.code || subject.choice;   // use choice code if it is a choice
            if (codeToPositions[code]
                || !newSubjectInfoData[code]
                || newSubjectInfoData[code].semester == "null"
                || isInSomeChoice(code, choices)
            ) {
                return;
            }

            let placed = false;
            while (!placed) {
                if (getTreePositions(newSubjectInfoData, semesterIndex, 
                                    positionIndex, code, codeToPositions,
                                    positionsToCode, choices)) {
                    placed = true;
                }
                positionIndex++;
            }
        })
    })

    const positions = {}

    Object.entries(codeToPositions).forEach(([code, [oldX, oldY]]) => {
        const x = Layout.padding + oldX * Layout.columnWidth  + (Layout.columnWidth - Layout.subjectWidth - 2 * Layout.subjectPadding) / 2;
        const y = oldY * Layout.rowHeight + (Layout.rowHeight - Layout.subjectHeight - 2 * Layout.subjectPadding) / 2;
        positions[code] = { x, y };

        if (x + Layout.columnWidth + Layout.subjectPadding * 2 > maxX) {maxX = x + Layout.columnWidth}
        if (y + Layout.rowHeight + Layout.subjectPadding * 2 > maxY) {maxY = y + Layout.rowHeight}
    })
    return [positions, maxX, maxY];
}


export function getTreePositions(newSubjectInfoData, semesterIndex, 
                          positionIndex, code, codeToPositions, 
                          positionsToCode, choices) {
    // Position already occupied
    if ((positionsToCode[semesterIndex]
        && positionsToCode[semesterIndex][positionIndex])) {
            return false;
    }

    // Already drew this node
    if (codeToPositions[code]) {
        return true;
    }

    let succs = newSubjectInfoData[code].successors;
    let currentY = positionIndex;
    for (let i = 0; i < succs.length; i++) {
        if (!newSubjectInfoData[succs[i].code]) { continue; }   // successor not in data, move to another one
        if (newSubjectInfoData[succs[i].code].semester != "null"
            && !isInSomeChoice(succs[i].code, choices)
            && !getTreePositions(newSubjectInfoData, semesterIndex + 1,
                                 currentY, succs[i].code, codeToPositions,
                                 positionsToCode, choices)) {
            return false;
        }
        currentY += 1;
    }
    codeToPositions[code] = [semesterIndex, positionIndex];
    positionsToCode[semesterIndex][positionIndex] = code;
    return true;
}


export function getOrGatesPositionsForSubject(code, course, processedSubjects, edgeYOffsets) {
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
            return yOffset + Layout.subjectHeight / 2 + 15;
        });
}
