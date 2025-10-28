const emptyNode = {
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
            ...emptyNode,
            semester: semester,
            successors: []
        };
    if (!orderData[semester].some(s => s.code === currentNodeCode))
        orderData[semester].push({"code": currentNodeCode});
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
        subjects.forEach(parent => {
            const parentCode = parent.code ?? parent.choice;
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
                                     subjectInfoData, subjectData,
                                     edgeYOffsets, offset) {
    if (!subjectInfoData[parentCode].successors.includes(successorCode)) {
        return;
    }
    
    // remove direct link
    subjectInfoData[parentCode].successors = subjectInfoData[parentCode].successors
        .filter(item => item !== successorCode);
    
        let prevNode = parentCode;
    
    // insert new helper nodes
    for (let i = parentSemester + 1; i < succSemester; i++) {
        let helperNodeCode = `HELPER_${successorCode}_${i}`;
        createHelperNode(subjectInfoData, subjectData["order"], prevNode, helperNodeCode, i);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}`, offset);
        prevNode = helperNodeCode;
    }

    // connect last helper to successor
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


function addChoiceNodes(details, order, choices) {
    Object.entries(order).forEach(([semester, subjectList]) => {
        subjectList.filter((subject) => subject["choice"] != undefined).forEach((choiceSubject) => {
            const code = choiceSubject["choice"];

            let successors = [];
            let predecessors = [];
            if (code != "core" && code != "tv") {
                successors = choices[code].list
                    .flatMap(item => details[item].successors)
                    .filter(item => !choices[code].list.includes(item));

                predecessors = choices[code].list
                    .flatMap(item => details[item].predecessors)
                    .filter(item => !choices[code].list.includes(item));
            }

           
            
            details[code] = {
                ...emptyNode,
                name: choices[code].refnCZ,
                successors: successors, 
                predecessors: predecessors,
                credits: choiceSubject.credits,
                semester: Number(semester),
                type: "choice"
            };
        });
    })
}


export function addHelperNodesAndGetOffsets(subjectData) {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    addChoiceNodes(subjectData["details"], subjectData["order"], subjectData["choices"]);
    const newDetails = structuredClone(subjectData["details"]);
    const oldDetails = subjectData["details"];

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const newSuccessors = [...course.successors];
        let parentSemester = parseSemester(course.semester);
        
        newSuccessors.forEach((successorCode, i) => {
            const successor = oldDetails[successorCode];
            if (!successor) {return;}

            let succSemester = parseSemester(successor.semester);
            const offset = ensureOffset(
                edgeYOffsets,
                `${parentCode}-${successorCode}`,
                (i - (newSuccessors.length - 1) / 2) * 12
            );

            if (parentSemester == null || 
                succSemester == null ||
                parentSemester + 1 == succSemester || 
                parentSemester > succSemester
            ) {
                return;
            }
            createSuccessingHelperNodes(parentCode, parentSemester, successorCode,
                                        succSemester, newDetails, subjectData,
                                        edgeYOffsets, offset);
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, subjectData["order"]);
    return [newDetails, edgeXOffsets, edgeYOffsets];
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
        let positionIndex = 0;

        semesterArray.forEach((subject) => {
            const code = subject.code || subject.choice;   // use choice code if it is a choice
            if (codeToPositions[code]
                || !newSubjectInfoData[code]
                || newSubjectInfoData[code].semester == "null"
                || isInSomeChoice(subject, choices)
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

function getTreePositions(newSubjectInfoData, semesterIndex, 
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
    
    for (let i = 0; i < succs.length; i++) {
        if (newSubjectInfoData[succs[i]].semester != "null"
            && !isInSomeChoice(newSubjectInfoData[succs[i]], choices)
            && !getTreePositions(newSubjectInfoData, semesterIndex + 1,
                                 i + positionIndex, succs[i], codeToPositions,
                                 positionsToCode, choices)) {
            return false;
        }
    }
    codeToPositions[code] = [semesterIndex, positionIndex];
    positionsToCode[semesterIndex][positionIndex] = code;
    return true;
}

function isInSomeChoice(subject, choices) {
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == subject || item.code == subject));
}