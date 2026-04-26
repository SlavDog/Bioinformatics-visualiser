import { Details, OrderSubject, Choices, Edge } from '@/types';
import { deleteCodeFromOrGroups } from '@utils/Graph/orGroups.js';
import { isInSomeChoice } from '@utils/Graph/choiceNodes';
import { emptyNode } from '@/consts/VisualisationParameters';

/**
 * Creates a chain of helper nodes between a parent and its successor
 * when they are more than one semester apart.
 *
 * Helper nodes act as visual waypoints so edges don't skip semesters.
 * Modifies `details`, `plan`, and `codesToSem` in place.
 *
 * @param parentCode - Code of the source node.
 * @param parentSemester - Semester of the source node.
 * @param successorCode - Code of the target node.
 * @param succSemester - Semester of the target node.
 * @param details - Catalog of all subjects and their metadata.
 * @param plan - The study plan containing the plan of subjects by semester.
 * @param choices - Available choices.
 * @param groups - OR-groups associated with the edge.
 * @param codesToSem - Mapping of subject codes to their recommended semesters.
 */
export function createSuccessingHelperNodes(
    parentCode: string,
    parentSemester: number | null,
    successorCode: string,
    succSemester: number | null,
    details: Details,
    plan: Record<string, OrderSubject[]>,
    choices: Choices,
    groups: string[][],
    codesToSem: Record<string, number>
): void {
    const targetEdge = details[parentCode]?.successors.find((s) => s.code === successorCode);
    if (
        !targetEdge ||
        parentSemester == null ||
        succSemester == null ||
        isInSomeChoice(parentCode, plan, choices)
    ) {
        return;
    }

    const byPrerequisites = targetEdge.by_prerequisites;

    removeDirectLink(parentCode, successorCode, details);
    const lastHelperNode = buildHelperChain(
        parentCode,
        successorCode,
        parentSemester,
        succSemester,
        byPrerequisites,
        details,
        plan,
        codesToSem
    );

    // Update OR-groups in successor and its predecessors to reference the last helper node
    const successorNode = details[successorCode];
    updateGroupsInEdges(successorNode.predecessors, parentCode, lastHelperNode);

    successorNode.predecessors.forEach((pred) => {
        const predNode = details[pred.code];
        if (predNode) {
            updateGroupsInEdges(predNode.successors, parentCode, lastHelperNode);
        }
    });

    connectFinalHelper(lastHelperNode, successorCode, groups, byPrerequisites, parentCode, details);
}

/**
 * Connects the last helper node in the chain to the original successor.
 * Updates OR-groups to replace the parent code with the helper code.
 */
function connectFinalHelper(
    helperCode: string,
    successorCode: string,
    groups: string[][],
    byPrereq: boolean,
    parentCode: string,
    details: Details
) {
    const cleanedGroups = deleteCodeFromOrGroups(groups, parentCode).map((group) => [
        ...group,
        helperCode
    ]);
    const edge = { code: successorCode, groups: cleanedGroups, by_prerequisites: byPrereq };

    details[helperCode].successors.push(edge);
    details[successorCode].predecessors.push({ ...edge, code: helperCode });
}

/**
 * Builds a chain of helper nodes between two semesters.
 *
 * @returns The code of the last node in the chain.
 */
function buildHelperChain(
    parentCode: string,
    successorCode: string,
    parentSemester: number,
    succSemester: number,
    byPrerequisites: boolean,
    details: Details,
    plan: Record<string, OrderSubject[]>,
    codesToSem: Record<string, number>
): string {
    let prevNode = parentCode;
    for (let i = parentSemester + 1; i < succSemester; i++) {
        const helperNodeCode = `HELPER_${parentCode}__${successorCode}_${i}`;

        createHelperNode(details, plan, prevNode, helperNodeCode, i, byPrerequisites, codesToSem);
        prevNode = helperNodeCode;
    }
    return prevNode;
}

/**
 * Removes the direct edge between a parent and its successor.
 * Modifies `details` in place.
 */
function removeDirectLink(parentCode: string, successorCode: string, details: Details) {
    details[parentCode].successors = details[parentCode].successors.filter(
        (item) => item.code !== successorCode
    );
    details[successorCode].predecessors = details[successorCode].predecessors.filter(
        (item) => item.code !== parentCode
    );
}

/**
 * Replaces `oldCode` with `newCode` in all OR-groups of the given edges.
 * Modifies edges in place.
 */
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

/**
 * Creates a single helper node and connects it to the previous node in the chain.
 * Modifies `details`, `plan`, and `codesToSem` in place.
 */
export function createHelperNode(
    details: Details,
    plan: Record<string, OrderSubject[]>,
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
