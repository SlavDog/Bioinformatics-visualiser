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


export function addHelperNodesAndOffsets(originalInfoData, orderData,
                                         edgeYOffsets, edgeXOffsets) {
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
    return newSubjectInfoData;
}