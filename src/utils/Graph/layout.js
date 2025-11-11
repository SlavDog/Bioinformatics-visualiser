import { isInSomeChoice } from "./choiceNodes";

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


export function getPositions(newSubjectInfoData, subjectOrderData, choices, padding,
                             columnWidth, rowHeight, subjectWidth,
                             subjectHeight, subjectPadding) {
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
        const x = oldX * columnWidth  + (columnWidth - subjectWidth - 2 * subjectPadding) / 2;
        const y = oldY * rowHeight + (rowHeight - subjectHeight - 2 * subjectPadding) / 2;
        positions[code] = { x, y };

        if (x + columnWidth + subjectPadding * 2 > maxX) {maxX = x + columnWidth}
        if (y + rowHeight + subjectPadding * 2 > maxY) {maxY = y + rowHeight}
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
