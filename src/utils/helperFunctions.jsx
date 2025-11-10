const emptyNode = {
    name: "",
    faculty: "",
    successors: [],
    predecessors: [],
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
    if (key in allOffsets) {
        if (allOffsets[key] !== offsetToAdd) {
            console.warn(`Overwriting key ${key}: ${allOffsets[key]} → ${offsetToAdd}`);
        }
    }
    if (!allOffsets[key]) {
        allOffsets[key] = offsetToAdd; 
    }
    return allOffsets[key];
}


function createHelperNode(infoData, orderData, prevNodeCode, currentNodeCode, semester, byPrerequisites) {
    if (!infoData[currentNodeCode]) {
        infoData[currentNodeCode] = {
            ...emptyNode,
            successors: [],
            predecessors: [],
            semester: semester,
        };
    if (!orderData[semester].some(s => s.code === currentNodeCode))
        orderData[semester].push({"code": currentNodeCode});
    }
    infoData[prevNodeCode].successors.push({"code": currentNodeCode, groups: [], "by_prerequisites": byPrerequisites});
    infoData[currentNodeCode].predecessors.push({"code": prevNodeCode, groups: [], "by_prerequisites": byPrerequisites});
}


function fillEdgeXOffsets(edgeXOffsets, infoData, orderData) {
    // count number of successors per semester
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code]) {return;}
            if (infoData[successor.code].semester != "null") {
                numberOfSuccsBySemester[course.semester - 1] += 1;
            }
        });
    });

    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        let i = 0;
        subjects.forEach(parent => {
            const parentCode = parent.code ?? parent.choice;
            if (!infoData[parentCode]) {return;}

            infoData[parentCode].successors.forEach(successor => {
                if (!infoData[successor.code]) {return;}
                ensureOffset(edgeXOffsets, `${parentCode}-${successor.code}`,
                    (i - (numberOfSuccsBySemester[semester] - 1) / 2) * 12);
                i += 1;
           })
        });
    });
}


function createSuccessingHelperNodes(parentCode, parentSemester,
                                     successorCode, succSemester,
                                     subjectInfoData, subjectData,
                                     edgeYOffsets, startOffset,
                                     endOffset, groups) {
    if (!subjectInfoData[parentCode].successors.some(succ => succ.code == successorCode)) {
        return;
    }

    const byPrerequisites = subjectInfoData[parentCode].successors
        .filter(successor => successor.code == successorCode)[0].by_prerequisites;
    
    // remove direct link
    subjectInfoData[parentCode].successors = subjectInfoData[parentCode].successors
        .filter(item => item.code !== successorCode);
    subjectInfoData[successorCode].predecessors = subjectInfoData[successorCode].predecessors
        .filter(item => item.code !== parentCode);
    let prevNode = parentCode;

    // insert new helper nodes
    for (let i = parentSemester + 1; i < succSemester; i++) {
        let helperNodeCode = `HELPER_${successorCode}_${i}`;
        createHelperNode(subjectInfoData, subjectData["order"], prevNode, helperNodeCode, i, byPrerequisites);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}-start`, startOffset);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}-end`, startOffset);
        prevNode = helperNodeCode;
    }

    console.log(groups);
    subjectInfoData[successorCode].predecessors.forEach(predecessor => {
        for (let i = 0; i < predecessor.groups.length; i++) {
            let group = predecessor.groups[i];
            group.push(prevNode);
            predecessor.groups[i] = group.filter(code => code !== parentCode);
        }
        subjectInfoData[predecessor.code].successors.forEach(successor => {
            for (let i = 0; i < successor.groups.length; i++) {
                let group = successor.groups[i];
                group.push(prevNode);
                successor.groups[i] = group.filter(code => code !== parentCode);
            }
        })
    })

    // connect last helper to successor
    groups = deleteCodeFromOrGroups(groups, parentCode);
    groups.forEach(group => group.push(prevNode));
    subjectInfoData[prevNode].successors.push({"code": successorCode, "groups": groups, "by_prerequisites": byPrerequisites});
    subjectInfoData[successorCode].predecessors.push({"code": prevNode, "groups": groups, "by_prerequisites": byPrerequisites});
    ensureOffset(edgeYOffsets, `${prevNode}-${successorCode}-start`, startOffset);
    ensureOffset(edgeYOffsets, `${prevNode}-${successorCode}-end`, endOffset);
}


function deleteCodeFromOrGroups(groups, codeToDelete) {
    return groups.map((group) =>
        group.filter(element => element != codeToDelete)
    );
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
        subjectList
        .filter((subject) => subject["choice"] != undefined)
        .forEach((choiceSubject) => {
            const choiceCode = choiceSubject["choice"];
            if (choiceCode == "core" || choiceCode == "tv") { return; }

            let successors = [];
            let predecessors = [];

            choices[choiceCode].list.forEach(code => {
                details[code].successors.forEach(successor => {
                    if (!choices[choiceCode].list.includes(successor.code)) {
                        successors.push({ ...successor });
                    }
                }) 
            })

            choices[choiceCode].list.forEach(code => {
                details[code].predecessors.forEach(predecessor => {
                    if (!choices[choiceCode].list.includes(predecessor.code)) {
                        predecessors.push({ ...predecessor });
                    }
                }) 
            })
            
            predecessors.forEach(predecessor => {
                details[predecessor.code].successors = details[predecessor.code].successors
                                                .filter(subject => !isInSomeChoice(subject.code, choices));
                details[predecessor.code].successors.push({"code": choiceCode, "groups" : predecessor.groups, "by_prerequisites": true});
            });
            
            details[choiceCode] = {
                ...emptyNode,
                name: choices[choiceCode].refnCZ,
                successors: successors, 
                predecessors: predecessors,
                credits: choiceSubject.credits,
                subjects: choiceSubject.subjects,
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
    const orGroupEndOffsets = {};

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const newSuccessors = [...course.successors];
        let parentSemester = parseSemester(course.semester);
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor) {return;}

            let offset = (i - (newSuccessors.length - 1) / 2) * 12;
            let succSemester = parseSemester(successor.semester);

            ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, offset);

            if (!successorInfo.groups || successorInfo.groups.length == 0) {
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, offset);
            } else {
                if (!orGroupEndOffsets[successorInfo.code]) {
                    fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
                }
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, orGroupEndOffsets[parentCode]);
            }

            if (shouldCreateHelperNodes(parentSemester, succSemester)) {
                createSuccessingHelperNodes(parentCode, parentSemester, successorInfo.code,
                                            succSemester, newDetails, subjectData,
                                            edgeYOffsets, offset, offset, successorInfo.groups);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, subjectData["order"]);
    return [newDetails, edgeXOffsets, edgeYOffsets];
}


function fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset) {
    successorInfo.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[codeInGroup] = offset;
        })
    })
}


function shouldCreateHelperNodes(parentSemester, succSemester) {
    return !(parentSemester == null || 
            succSemester == null ||
            parentSemester + 1 == succSemester || 
            parentSemester > succSemester);
}

export function getYOffsetForOrGroup(edgeYOffsets, group, succCode) {
    let i = 0;
    while (i < group.length) {
        console.log(`${group[i]}-${succCode}-end`);
        if (`${group[i]}-${succCode}-end` in edgeYOffsets) {
            return edgeYOffsets[`${group[i]}-${succCode}-end`];
        }
        i++;
    }
    console.warn("No offset found for OR group", group, "to", succCode);
}

export function getUniquePredGroups(course) {
    let seen = new Set();
    let result = [];
    course.predecessors.forEach(pred => {
        pred.groups.forEach(group => {
            let groupKey = group.slice().sort().join(',');
            if (!seen.has(groupKey)) {
                seen.add(groupKey);
                result.push(group);
            }
        });
    });
    console.log(result);
    return result;
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

export function isInSomeChoice(subject, choices) {
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == subject || item.code == subject));
}