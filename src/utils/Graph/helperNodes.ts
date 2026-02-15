import { Details, EdgeOffsets, Spec, OrderSubject, Choices } from '@/types/subjects';
import { emptyNode, ensureOffset } from '@utils/Graph/dataUtils.js';
import { deleteCodeFromOrGroups } from '@utils/Graph/orGroups.js';
import { isInSomeChoice } from './choiceNodes';
export function createSuccessingHelperNodes(parentCode: string, parentSemester: number,
                                     successorCode: string, succSemester: number,
                                     newDetails: Details, order: Record<string, Array<OrderSubject>>, choices: Choices,
                                     edgeYOffsets: EdgeOffsets, startOffset: number,
                                     endOffset: number, groups: Array<Array<string>>) : void {
    if (!newDetails[parentCode].successors.some(succ => succ.code == successorCode)
            || isInSomeChoice(parentCode, order, choices)) {
        return;
    }

    const byPrerequisites = newDetails[parentCode].successors
        .filter(successor => successor.code == successorCode)[0].by_prerequisites;
    
    // remove direct link
    newDetails[parentCode].successors = newDetails[parentCode].successors
        .filter(item => item.code !== successorCode);
    newDetails[successorCode].predecessors = newDetails[successorCode].predecessors
        .filter(item => item.code !== parentCode);
    let prevNode = parentCode;

    // insert new helper nodes
    for (let i = parentSemester + 1; i < succSemester; i++) {
        let helperNodeCode = `HELPER_${successorCode}_${i}`;
        createHelperNode(newDetails, order, prevNode, helperNodeCode, i, byPrerequisites);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}-start`, i == parentSemester + 1 ? startOffset : endOffset);
        ensureOffset(edgeYOffsets, `${prevNode}-${helperNodeCode}-end`, endOffset);
        prevNode = helperNodeCode;
    }

    newDetails[successorCode].predecessors.forEach(predecessor => {
        for (let i = 0; i < predecessor.groups.length; i++) {
            let group = predecessor.groups[i];
            group.push(prevNode);
            predecessor.groups[i] = group.filter(code => code !== parentCode);
        }
        newDetails[predecessor.code].successors.forEach(successor => {
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
    newDetails[prevNode].successors.push({"code": successorCode, "groups": groups, "by_prerequisites": byPrerequisites});
    newDetails[successorCode].predecessors.push({"code": prevNode, "groups": groups, "by_prerequisites": byPrerequisites});
    ensureOffset(edgeYOffsets, `${prevNode}-${successorCode}-start`, endOffset);
    ensureOffset(edgeYOffsets, `${prevNode}-${successorCode}-end`, endOffset);
}


export function createHelperNode(details: Details, plan: Record<string, Array<OrderSubject>>, 
        prevNodeCode: string, currentNodeCode: string, 
        semester: number, byPrerequisites: boolean) : void {
    if (!details[currentNodeCode]) {
        details[currentNodeCode] = {
            ...emptyNode,
            successors: [],
            predecessors: [],
            semester: semester,
        };
    if (!plan[semester].some(s => "code" in s && s.code === currentNodeCode))
        plan[semester].push({"code": currentNodeCode});
    }
    details[prevNodeCode].successors.push({"code": currentNodeCode, groups: [], "by_prerequisites": byPrerequisites});
    details[currentNodeCode].predecessors.push({"code": prevNodeCode, groups: [], "by_prerequisites": byPrerequisites});
}
