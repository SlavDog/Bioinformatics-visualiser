import { ensureOffset } from '@utils/Graph/dataUtils.js';
import { EdgeOffsets, Details, Edge, OrderSubject, CodeToPosition } from '@/types';
import { Layout } from '@/consts/VisualisationParameters';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculates the necessary X and Y offsets for edges in the graph to minimize crossings and improve readability.
 * @param details - Catalog of all subjects and their metadata.
 * @param pos - The calculated positions of subjects in the layout.
 * @param plan - The study plan containing the order of subjects by semester.
 * @param codesToSem - Mapping of subject codes to their recommended semesters.
 * @returns A tuple containing the X offsets and Y offsets for edges.
 */
export function getOffsets(
    details: Details,
    pos: CodeToPosition,
    plan: Record<string, OrderSubject[]>,
    codesToSem: Record<string, number>
): [EdgeOffsets, EdgeOffsets] {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    fillEdgeYOffsets(edgeYOffsets, details, plan, pos);
    fillEdgeXOffsets(edgeXOffsets, details, plan, pos, codesToSem);
    return [edgeXOffsets, edgeYOffsets];
}

// ─── X offsets  ──────────────────────────────────────────────────────────────

/**
 * Calculates the X offsets for edges based on the positions of subjects and their successors.
 * @param edgeXOffsets - The object to be filled with calculated X offsets for edges.
 * @param details - Catalog of all subjects and their metadata.
 * @param plan - The study plan containing the order of subjects by semester.
 * @param pos - The calculated positions of subjects in the layout.
 * @param codesToSem - Mapping of subject codes to their recommended semesters.
 */
export function fillEdgeXOffsets(
    edgeXOffsets: EdgeOffsets,
    details: Details,
    plan: Record<string, OrderSubject[]>,
    pos: CodeToPosition,
    codesToSem: Record<string, number>
): void {
    const numberOfSuccsBySemester = getNumberOfSuccsBySemester(plan, details, codesToSem);

    // assign x offsets
    Object.entries(plan).forEach(([semester, subjects]) => {
        const centerOffset = (numberOfSuccsBySemester[Number(semester) - 1] - 1) / 2;
        let edgeIndex = 0;

        const shouldReverseSemester = shouldReverseSemesterSubjects(subjects, details, pos);
        const sortedSubjects = sortByPositions(subjects, pos);
        const processedSubjects = shouldReverseSemester ? sortedSubjects.reverse() : sortedSubjects;

        processedSubjects.forEach((parent) => {
            const parentCode = getSubjectCode(parent);
            if (!details[parentCode]) {
                return;
            }
            const successors = sortByPositions(details[parentCode].successors, pos);
            if (successors.length == 0) {
                return;
            }

            const shouldReverse = shouldReverseSuccs(pos, parentCode, successors);
            const orderedSuccessors = shouldReverse ? [...successors].reverse() : successors;

            orderedSuccessors.forEach((successor) => {
                if (!details[successor.code]) {
                    return;
                }
                ensureOffset(
                    edgeXOffsets,
                    `${parentCode}-${successor.code}`,
                    (edgeIndex - centerOffset) * Layout.edgeXOffsetStep
                );
                edgeIndex += 1;
            });
        });
    });
}

/**
 * Determines whether the subjects in a semester should be processed in reverse order based on the average Y coordinate of their successors.
 * This is a heuristic to minimize edge crossings by ordering the x-offsets.
 * @param subjects - The list of subjects in the semester.
 * @param details - Catalog of all subjects and their metadata.
 * @param pos - The calculated positions of subjects in the layout.
 * @returns True if the subjects should be processed in reverse order, false otherwise.
 */
function shouldReverseSemesterSubjects(
    subjects: OrderSubject[],
    details: Details,
    pos: CodeToPosition
): boolean {
    let totalDiff = 0;
    let validPairs = 0;

    for (const subject of subjects) {
        const parentCode = getSubjectCode(subject);
        const parentData = details[parentCode];
        if (!parentData) continue;

        const parentY = pos[parentCode]?.y ?? 0;

        for (const successor of parentData.successors) {
            const succY = pos[successor.code]?.y;
            if (succY !== undefined) {
                totalDiff += succY - parentY;
                validPairs++;
            }
        }
    }

    return validPairs > 0 && totalDiff / validPairs > 0;
}

/**
 * Determines whether the successors of a subject should be processed in reverse order based on their Y coordinates.
 * @param pos - The calculated positions of subjects in the layout.
 * @param parentCode - The code of the parent subject.
 * @param successors - The list of successor subjects.
 * @returns True if the successors should be processed in reverse order, false otherwise.
 */
function shouldReverseSuccs(pos: CodeToPosition, parentCode: string, successors: Edge[]) {
    const parentY = pos[parentCode].y ?? 0;
    let totalDiff = 0;
    let validSuccs = 0;

    successors.forEach((s) => {
        if (pos[s.code].y !== undefined) {
            totalDiff += pos[s.code].y - parentY;
            validSuccs++;
        }
    });

    return validSuccs > 0 && totalDiff / validSuccs > 0;
}

/** Calculates the number of successors for each semester. */
function getNumberOfSuccsBySemester(
    orderData: Record<string, OrderSubject[]>,
    infoData: Details,
    codesToSem: Record<string, number>
): number[] {
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.entries(infoData).forEach(([code, course]) => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code] || codesToSem[successor.code] == null) {
                return;
            }
            numberOfSuccsBySemester[Number(codesToSem[code]) - 1] += 1;
        });
    });
    return numberOfSuccsBySemester;
}

// ─── Y offsets  ──────────────────────────────────────────────────────────────

/**
 * Calculates the Y offsets for edges based on the positions of subjects and their successors, as well as the structure of the graph (e.g., OR groups).
 * @param edgeYOffsets - The object to be filled with calculated Y offsets for edges.
 * @param details - Catalog of all subjects and their metadata.
 * @param plan - The plan containing the subjects for each semester.
 * @param pos - The calculated positions of subjects in the layout.
 */
export function fillEdgeYOffsets(
    edgeYOffsets: EdgeOffsets,
    details: Details,
    plan: Record<string, OrderSubject[]>,
    pos: CodeToPosition
) {
    const orGroupEndOffsets: Record<string, number> = {};
    const pathTargetOffsets: Record<string, number> = {};
    Object.values(plan).forEach((semester) => {
        sortByPositions(semester, pos).forEach((subj) => {
            const parentCode = getSubjectCode(subj);
            if (!details[parentCode]) {
                return;
            }
            sortByPositions(details[parentCode].successors, pos).forEach((succ, i) => {
                assignOffsets(
                    parentCode,
                    succ,
                    details,
                    edgeYOffsets,
                    orGroupEndOffsets,
                    i,
                    pathTargetOffsets,
                    pos
                );
            });
        });
    });
}

/**
 * Assigns Y offsets to edges based on their positions and the structure of the graph.
 * @param parentCode - The code of the parent subject.
 * @param successorInfo - Information about the successor subject.
 * @param details - The catalog of all subjects and their metadata.
 * @param edgeYOffsets - The object to be filled with calculated Y offsets for edges.
 * @param orGroupEndOffsets - A record of end offsets for OR groups.
 * @param i - The index of the successor in the list of successors.
 * @param pathTargetOffsets - A record of target offsets for paths.
 * @param pos - The calculated positions of subjects in the layout.
 */
function assignOffsets(
    parentCode: string,
    successorInfo: Edge,
    details: Details,
    edgeYOffsets: Record<string, number>,
    orGroupEndOffsets: Record<string, number>,
    i: number,
    pathTargetOffsets: Record<string, number>,
    pos: CodeToPosition
) {
    const realSuccessorCode = findRealSuccessor(successorInfo.code, details);
    const isParentHelper = parentCode.startsWith('HELPER');
    const pathKey = getPathCode(parentCode, realSuccessorCode, isParentHelper);

    const endOffset = computeEndOffset(
        parentCode,
        realSuccessorCode,
        isParentHelper,
        pathKey,
        successorInfo,
        pathTargetOffsets,
        details,
        pos
    );
    const startOffset = computeStartOffset(i, parentCode, isParentHelper, endOffset, details);

    ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, startOffset);
    resolveEndOffset(
        edgeYOffsets,
        orGroupEndOffsets,
        parentCode,
        successorInfo.code,
        successorInfo.groups,
        endOffset,
        successorInfo
    );
}

/**
 * Computes the start offset of an edge from the parent's side.
 * HELPER parents use the same value as the end offset (straight pass-through).
 */
function computeStartOffset(
    i: number,
    parentCode: string,
    isParentHelper: boolean,
    endOffset: number,
    details: Details
): number {
    if (isParentHelper) return endOffset;
    return (i - (details[parentCode].successors.length - 1) / 2) * Layout.offsetStep;
}

/**
 * Computes the end offset of an edge by looking up which OR group
 * the parent belongs to (if any), and delegating accordingly.
 */
function computeEndOffset(
    parentCode: string,
    realSuccessorCode: string,
    isParentHelper: boolean,
    pathKey: string,
    successorInfo: Edge,
    pathTargetOffsets: Record<string, number>,
    details: Details,
    pos: CodeToPosition
): number {
    const myGroup = successorInfo.groups?.find((g) => g.includes(parentCode));

    if (myGroup) {
        const definedSubject = myGroup.find(
            (subj) =>
                pathTargetOffsets[
                    getPathCode(subj, realSuccessorCode, subj.startsWith('HELPER'))
                ] !== undefined
        );
        return resolveGroupEndOffset(
            myGroup,
            pathKey,
            definedSubject,
            parentCode,
            realSuccessorCode,
            pathTargetOffsets,
            details,
            pos
        );
    }

    return resolveIndividualEndOffset(
        parentCode,
        realSuccessorCode,
        isParentHelper,
        pathKey,
        pathTargetOffsets,
        details,
        pos
    );
}

/**
 * Resolves the end offset for a path that belongs to an OR group.
 * If the path offset is already cached, returns it directly.
 * Otherwise computes a new shared offset for all group members and caches it.
 */
function resolveGroupEndOffset(
    myGroup: string[],
    pathKey: string,
    definedSubject: string | undefined,
    parentCode: string,
    realSuccessorCode: string,
    pathTargetOffsets: Record<string, number>,
    details: Details,
    pos: CodeToPosition
): number {
    if (pathTargetOffsets[pathKey] !== undefined) {
        return pathTargetOffsets[pathKey];
    }

    const newOffset = definedSubject
        ? pathTargetOffsets[
              getPathCode(definedSubject, realSuccessorCode, definedSubject.startsWith('HELPER'))
          ]
        : getEndOffset(parentCode, realSuccessorCode, details, pos);

    myGroup.forEach((memberCode) => {
        const memberPathId = getPathCode(
            memberCode,
            realSuccessorCode,
            memberCode.startsWith('HELPER')
        );
        pathTargetOffsets[memberPathId] = newOffset;
    });

    return pathTargetOffsets[pathKey];
}

/**
 * Resolves the end offset for a path that does NOT belong to any OR group.
 * HELPER parents share the offset of their real (non-helper) counterpart.
 */
function resolveIndividualEndOffset(
    parentCode: string,
    realSuccessorCode: string,
    isParentHelper: boolean,
    pathKey: string,
    pathTargetOffsets: Record<string, number>,
    details: Details,
    pos: CodeToPosition
): number {
    if (!isParentHelper) {
        const offset = getEndOffset(parentCode, realSuccessorCode, details, pos);
        pathTargetOffsets[pathKey] = offset;
        return offset;
    }

    const originalCode = parentCode.replace(/^HELPER_/, '').split('__')[0];
    const originalPathKey = `${originalCode}_${realSuccessorCode}`;
    const offset =
        pathTargetOffsets[originalPathKey] ??
        getEndOffset(originalCode, realSuccessorCode, details, pos);
    pathTargetOffsets[pathKey] = offset;
    return offset;
}

/** Resolves the end offset for an edge, taking into account OR groups and previously calculated offsets. */
function resolveEndOffset(
    edgeYOffsets: EdgeOffsets,
    orGroupEndOffsets: Record<string, number>,
    parentCode: string,
    succCode: string,
    groups: string[][],
    offset: number,
    successorInfo: Edge
): void {
    if (!groups || groups.length == 0) {
        ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-end`, offset);
        return;
    }
    if (orGroupEndOffsets[`${parentCode}-${succCode}`] === undefined) {
        fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
    }
    ensureOffset(
        edgeYOffsets,
        `${parentCode}-${succCode}-end`,
        orGroupEndOffsets[`${parentCode}-${succCode}`]
    );
}

/**
 * Calculates the Y offset for the end of an edge based on its predecessors' positions.
 * @param parentCode - The code of the parent subject.
 * @param succCode - The code of the successor subject.
 * @param details - The catalog of all subjects and their metadata.
 * @param pos - The calculated positions of subjects in the layout.
 */
function getEndOffset(
    parentCode: string,
    succCode: string,
    details: Details,
    pos: CodeToPosition
): number {
    const realParent = resolveHelperCode(parentCode);

    const sortedPreds = [...details[succCode].predecessors].sort((a, b) => {
        const realA = a.code;
        const realB = b.code;
        const yDiff = (pos[realA]?.y ?? 0) - (pos[realB]?.y ?? 0);
        if (yDiff !== 0) return yDiff;

        // If Y coordinates are the same, sort by X coordinate
        if (pos[realA]?.y < pos[succCode]?.y) {
            return (pos[realB]?.x ?? 0) - (pos[realA]?.x ?? 0);
        } else {
            return (pos[realA]?.x ?? 0) - (pos[realB]?.x ?? 0);
        }
    });

    const predIndex = sortedPreds.findIndex((p) => {
        const realP = resolveHelperCode(p.code);
        return realP === realParent;
    });

    const inDegree = sortedPreds.length;
    return (predIndex - (inDegree - 1) / 2) * Layout.offsetStep;
}

// ─── OR groups  ──────────────────────────────────────────────────────────────

/** Generates a unique key for a path between a parent and successor, accounting for HELPER subjects. */
function getPathCode(startCode: string, endCode: string, isParentHelper: boolean) {
    return isParentHelper
        ? startCode.replace(/^HELPER_/, '').replace(/_\d+$/, '')
        : `${startCode}_${endCode}`;
}

/** Fills the OR group end offsets for a given edge and its groups. */
export function fillOrGroupOffsets(
    orGroupEndOffsets: Record<string, number>,
    edge: Edge,
    offset: number
): void {
    edge.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[`${codeInGroup}-${edge.code}`] = offset;
        });
    });
}

/** Retrieves the Y offset for an edge that belongs to an OR group, if it exists. */
export function getYOffsetForOrGroup(
    edgeYOffsets: EdgeOffsets,
    group: string[],
    succCode: string
): number | undefined {
    let i = 0;
    while (i < group.length) {
        if (`${group[i]}-${succCode}-end` in edgeYOffsets) {
            return edgeYOffsets[`${group[i]}-${succCode}-end`];
        }
        i++;
    }
    console.warn('No offset found for OR group', group, 'to', succCode);
}

// ─── Helper functions  ──────────────────────────────────────────────────────

//** Finds the real successor of a subject, accounting for HELPER subjects. */
function findRealSuccessor(currentCode: string, details: Details): string {
    if (currentCode.includes('HELPER')) {
        const succs = details[currentCode]?.successors;
        if (succs && succs.length > 0) {
            return findRealSuccessor(succs[0].code, details);
        }
    }
    return currentCode;
}

//** Sorts an array of subjects (or choices) based on their Y coordinate in the layout. */
function sortByPositions<T extends { code: string } | { choice: string }>(
    array: T[],
    pos: CodeToPosition
): T[] {
    return [...array].sort((a, b) => {
        const codeA = getSubjectCode(a);
        const codeB = getSubjectCode(b);
        const yA = pos[codeA]?.y ?? 0;
        const yB = pos[codeB]?.y ?? 0;
        return yA - yB;
    });
}

/** Returns the code of a subject regardless of whether it's a `{ code }` or `{ choice }` object. */
function getSubjectCode(subject: { code: string } | { choice: string }): string {
    return 'code' in subject ? subject.code : subject.choice;
}

/** Returns the code of the real parent subject, accounting for HELPER subjects. */
function resolveHelperCode(code: string): string {
    return code.startsWith('HELPER') ? code.replace(/^HELPER_/, '').split('__')[0] : code;
}
