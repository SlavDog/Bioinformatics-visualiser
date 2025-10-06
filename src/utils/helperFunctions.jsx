const helperNode = {
  name: "",
  faculty: "",
  successors: [],
  language: "",
  completion: "",
  has_successors: true,
  has_parent: true,
  credits: "",
  link: ""
};


function parseSemester(val) {
  return val === "null" ? null : Number(val);
}


function ensureOffset(allOffsets, key, offsetToAdd) {
    if (!allOffsets[key]) {
        allOffsets[key] = offsetToAdd; 
    }
    return allOffsets[key];
}


function createHelperNode(infoData, orderData, prevNodeCode, currentNodeCode, semester) {
    if (!infoData[currentNodeCode]) {
        infoData[currentNodeCode] = {
            ...helperNode,
            semester: semester,
            successors: []
        };
    if (!orderData[semester].includes(currentNodeCode))
        orderData[semester].push(currentNodeCode);
    }
    infoData[prevNodeCode].successors.push(currentNodeCode);
}


function fillEdgeXOffsets(edgeXOffsets, infoData, orderData) {
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successorCode) => {
            if (infoData[successorCode].semester != "null") {
                numberOfSuccsBySemester[course.semester - 1] += 1;
            }
        });
    });
    Object.entries(orderData).forEach(([semester, subjects]) => {
        let i = 0;
        subjects.forEach(parentCode => {
            if (!infoData[parentCode]) {return;}
            infoData[parentCode].successors.forEach(successorCode => {
                ensureOffset(edgeXOffsets, `${parentCode}-${successorCode}`,
                    (i - (numberOfSuccsBySemester[semester] - 1) / 2) * 12);
                i += 1;
           })
        });
    });
}


function createSuccessingHelperNodes(parentCode, parentSemester,
                                     successorCode, succSemester,
                                     subjectInfoData, orderData,
                                     edgeYOffsets, offset) {
    subjectInfoData[parentCode].successors = subjectInfoData[parentCode].successors
        .filter(item => item !== successorCode);
    let prevNode = parentCode;
    
    for (let i = parentSemester + 1; i < succSemester; i++) {
        let helperNodeCode = `HELPER_${successorCode}_${i}`;
        createHelperNode(subjectInfoData, orderData, prevNode, helperNodeCode, i);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}`, offset);
        prevNode = helperNodeCode;
    }
    subjectInfoData[prevNode].successors.push(successorCode);
    ensureOffset(edgeYOffsets, `${prevNode}-${successorCode}`, offset);
}


function getSubtreeSizes(data) {
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


function getSubtreeSizesAux(data, visited, current, resultSizes, resultDepths) {
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


export function addHelperNodesAndGetOffsets(originalInfoData, orderData) {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    const newSubjectInfoData = structuredClone(originalInfoData)

    Object.entries(originalInfoData).forEach(([parentCode, course]) => {
        const newSuccessors = [...course.successors];
        newSuccessors.forEach((successorCode, i) => {
            if (!originalInfoData[successorCode]) {return;}

            let succSemester = parseSemester(originalInfoData[successorCode].semester);
            let parentSemester = parseSemester(course.semester);
            const offset = ensureOffset(edgeYOffsets, `${parentCode}-${successorCode}`,
                        (i - (newSuccessors.length - 1) / 2) * 12);

            // Create helper nodes in layers between connected subjects from distant semesters
            if (parentSemester != null && succSemester != null
                    && parentSemester + 1 != succSemester 
                    && parentSemester < succSemester) {
                createSuccessingHelperNodes(parentCode, parentSemester, successorCode,
                                            succSemester, newSubjectInfoData, orderData,
                                            edgeYOffsets, offset);
            }
        })
    });

    fillEdgeXOffsets(edgeXOffsets, newSubjectInfoData, orderData);
    return [newSubjectInfoData, edgeXOffsets, edgeYOffsets];
}



export function getPositions(newSubjectInfoData, subjectOrderData, padding,
                             columnWidth, rowHeight, subjectWidth,
                             subjectHeight, subjectPadding) {
    let maxX = 0;
    let maxY = 0;
    let semestersCount = Object.keys(subjectOrderData).length;

    const [subtreeSizes, subtreeDepths] = getSubtreeSizes(newSubjectInfoData);
    
    const codeToPositions = {};
    const positionsToCode = Array.from({ length: semestersCount }, () => []);
    Object.values(subjectOrderData).forEach((semesterArray, semesterIndex) => {
        let positionIndex = 0;
        semesterArray.forEach((code) => {
            if (codeToPositions[code] || !newSubjectInfoData[code] || newSubjectInfoData[code].semester == "null") {
                return;
            }
            let placed = false;
            while (!placed) {
                if (getTreePositions(newSubjectInfoData, semesterIndex, 
                                    positionIndex, code, codeToPositions,
                                    positionsToCode)) {
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

function getTreePositions(newSubjectInfoData, semesterIndex, 
                          positionIndex, code, codeToPositions, positionsToCode) {
    if ((positionsToCode[semesterIndex] &&
        positionsToCode[semesterIndex][positionIndex])) {
            return false;
    }
    let succs = newSubjectInfoData[code].successors;
    
    for (let i = 0; i < succs.length; i++) {
        if (newSubjectInfoData[succs[i]].semester != "null"
            && !getTreePositions(newSubjectInfoData, semesterIndex + 1,
                                 i + positionIndex, succs[i], codeToPositions,
                                 positionsToCode)) {
            return false;
        }
    }
    codeToPositions[code] = [semesterIndex, positionIndex];
    positionsToCode[semesterIndex][positionIndex] = code;
    return true;
}