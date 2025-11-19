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
    
    const codeToCoordinates = {};
    const positionsToCode = Array.from({ length: semestersCount }, () => []);

    Object.values(subjectOrderData).forEach((semesterArray, semesterIndex) => {
        semesterArray.forEach((subject) => {
            let positionIndex = 0;
            const code = subject.code || subject.choice;   // use choice code if it is a choice
            if (codeToCoordinates[code]
                || !newSubjectInfoData[code]
                || newSubjectInfoData[code].semester == "null"
            ) {
                return;
            }

            let placed = false;
            while (!placed) {
                if (getTreePositions(newSubjectInfoData, semesterIndex, 
                                    positionIndex, code, codeToCoordinates,
                                    positionsToCode, choices)) {
                    placed = true;
                }
                positionIndex++;
            }
        })
    })

    const realPositions = {}

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


export function getTreePositions(newSubjectInfoData, semesterIndex, 
                          positionIndex, code, codeToCoordinates, 
                          positionsToCode, choices) {
    // Position already occupied
    if ((positionsToCode[semesterIndex]
        && positionsToCode[semesterIndex][positionIndex])) {
            return false;
    }

    // Already drew this node
    if (codeToCoordinates[code]) {
        return true;
    }

    let succs = newSubjectInfoData[code].successors;
    let currentY = positionIndex;
    for (let i = 0; i < succs.length; i++) {
        if (!newSubjectInfoData[succs[i].code]) { continue; }   // successor not in data, move to another one
        if (newSubjectInfoData[succs[i].code].semester != "null"
            && !getTreePositions(newSubjectInfoData, semesterIndex + 1,
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
