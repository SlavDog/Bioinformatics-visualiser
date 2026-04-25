import { Details, EdgeOffsets, Spec, OrderSubject, Choices, Edge } from '@/types';
import { emptyNode, ensureOffset } from '@utils/Graph/dataUtils.js';
import { deleteCodeFromOrGroups } from '@utils/Graph/orGroups.js';
import { isInSomeChoice } from './choiceNodes';
export function createSuccessingHelperNodes(
    parentCode: string,
    parentSemester: number | null,
    successorCode: string,
    succSemester: number | null,
    newDetails: Details,
    order: Record<string, Array<OrderSubject>>,
    choices: Choices,
    groups: Array<Array<string>>,
    codesToSem: Record<string, number>
): void {
    const targetEdge = newDetails[parentCode]?.successors.find((s) => s.code === successorCode);
    if (
        !targetEdge ||
        parentSemester == null ||
        succSemester == null ||
        isInSomeChoice(parentCode, order, choices)
    ) {
        return;
    }

    const byPrerequisites = targetEdge.by_prerequisites;

    removeDirectLink(parentCode, successorCode, newDetails);
    let lastNode = buildHelperChain(
        parentCode,
        successorCode,
        parentSemester,
        succSemester,
        byPrerequisites,
        newDetails,
        order,
        codesToSem
    );

    // set correct groups
    const successorNode = newDetails[successorCode];
    updateGroupsInEdges(successorNode.predecessors, parentCode, lastNode);

    successorNode.predecessors.forEach((pred) => {
        const predNode = newDetails[pred.code];
        if (predNode) {
            updateGroupsInEdges(predNode.successors, parentCode, lastNode);
        }
    });

    connectFinalHelper(lastNode, successorCode, groups, byPrerequisites, parentCode, newDetails);
}

function connectFinalHelper(
    helperCode: string,
    successorCode: string,
    groups: string[][],
    byPrereq: boolean,
    parentCode: string,
    newDetails: Details
) {
    const cleanedGroups = deleteCodeFromOrGroups(groups, parentCode).map((group) => [
        ...group,
        helperCode
    ]);
    const edge = { code: successorCode, groups: cleanedGroups, by_prerequisites: byPrereq };

    newDetails[helperCode].successors.push(edge);
    newDetails[successorCode].predecessors.push({ ...edge, code: helperCode });
}

function buildHelperChain(
    parentCode: string,
    successorCode: string,
    parentSemester: number,
    succSemester: number,
    byPrerequisites: boolean,
    newDetails: Details,
    order: Record<string, Array<OrderSubject>>,
    codesToSem: Record<string, number>
): string {
    let prevNode = parentCode;
    for (let i = parentSemester + 1; i < succSemester; i++) {
        const helperNodeCode = `HELPER_${parentCode}__${successorCode}_${i}`;

        createHelperNode(
            newDetails,
            order,
            prevNode,
            helperNodeCode,
            i,
            byPrerequisites,
            codesToSem
        );
        prevNode = helperNodeCode;
    }
    return prevNode;
}

function removeDirectLink(parentCode: string, successorCode: string, newDetails: Details) {
    newDetails[parentCode].successors = newDetails[parentCode].successors.filter(
        (item) => item.code !== successorCode
    );
    newDetails[successorCode].predecessors = newDetails[successorCode].predecessors.filter(
        (item) => item.code !== parentCode
    );
}

function updateGroupsInEdges(edges: Edge[], oldCode: string, newCode: string) {
    edges.forEach((edge) => {
        edge.groups = edge.groups.map((group) => {
            if (group.includes(oldCode)) {
                return [...group.filter((c) => c !== oldCode), newCode];
            }
            return group;
        });
    });
}

export function createHelperNode(
    details: Details,
    plan: Record<string, Array<OrderSubject>>,
    prevNodeCode: string,
    currentNodeCode: string,
    semester: number,
    byPrerequisites: boolean,
    codesToSem: Record<string, number>
): void {
    if (!details[currentNodeCode]) {
        details[currentNodeCode] = {
            ...emptyNode,
            successors: [],
            predecessors: []
        };
        if (!plan[semester].some((s) => 'code' in s && s.code === currentNodeCode))
            plan[semester].push({ code: currentNodeCode });
    }
    details[prevNodeCode].successors.push({
        code: currentNodeCode,
        groups: [],
        by_prerequisites: byPrerequisites
    });
    details[currentNodeCode].predecessors.push({
        code: prevNodeCode,
        groups: [],
        by_prerequisites: byPrerequisites
    });

    codesToSem[currentNodeCode] = semester;
}
