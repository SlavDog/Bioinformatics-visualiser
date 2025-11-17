import { emptyNode, ensureOffset } from '@utils/Graph/dataUtils.js';
import { deleteCodeFromOrGroups } from '@utils/Graph/orGroups.js';

export function createSuccessingHelperNodes(parentCode, parentSemester,
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



export function createHelperNode(infoData, orderData, prevNodeCode, currentNodeCode, semester, byPrerequisites) {
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
