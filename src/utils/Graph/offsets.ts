import { ensureOffset } from '@utils/Graph/dataUtils.js';
import { EdgeOffsets, Details, Edge, OrderSubject, CodeToPosition } from '@/types/subjects';
import { Layout } from '@/consts/VisualisationParameters';

const OFFSET_STEP = 12;

export function getOffsets(
    details: Details,
    pos: CodeToPosition,
    plan: Record<string, Array<OrderSubject>>,
    codesToSem: Record<string, number>
) {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    fillEdgeYOffsets(edgeYOffsets, details, plan, pos);
    fillEdgeXOffsets(edgeXOffsets, details, plan, pos, codesToSem);
    return [edgeXOffsets, edgeYOffsets];
}

export function fillEdgeXOffsets(
    edgeXOffsets: EdgeOffsets,
    infoData: Details,
    orderData: Record<string, Array<OrderSubject>>,
    pos: CodeToPosition,
    codesToSem: Record<string, number>
): void {
    const numberOfSuccsBySemester = getNumberOfSuccsBySemester(orderData, infoData, codesToSem);

    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        const centerOffset = (numberOfSuccsBySemester[Number(semester) - 1] - 1) / 2;
        let edgeIndex = 0;
        const shouldReverseSemester = shouldReverseSemesterSubjects(subjects, infoData, pos);
        const sortedSubjects = sortByPositions(subjects, pos);
        const processedSubjects = shouldReverseSemester ? sortedSubjects.reverse() : sortedSubjects;

        processedSubjects.forEach((parent) => {
            const parentCode = 'code' in parent ? parent.code : parent.choice;
            if (!infoData[parentCode]) {
                return;
            }
            const successors = sortByPositions(infoData[parentCode].successors, pos);
            if (successors.length == 0) {
                return;
            }

            const shouldReverse = getShouldReverse(pos, parentCode, successors);
            const processedSuccessors = shouldReverse ? [...successors].reverse() : successors;

            processedSuccessors.forEach((successor) => {
                if (!infoData[successor.code]) {
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

function shouldReverseSemesterSubjects(
    subjects: Array<OrderSubject>,
    infoData: Details,
    pos: CodeToPosition
): boolean {
    let totalDiff = 0;
    let validPairs = 0;

    for (const subject of subjects) {
        const parentCode = 'code' in subject ? subject.code : subject.choice;
        const parentData = infoData[parentCode];
        if (!parentData) continue;

        const parentY = pos[parentCode]?.y ?? 0;

        for (const successor of parentData.successors) {
            const succY = pos[successor.code]?.y;
            if (succY !== undefined) {
                totalDiff += succY - parentY; // Pozitivní = nástupce je NÍŽE
                validPairs++;
            }
        }
    }

    // Reverse pokud jsou nástupci průměrně NÍŽE než rodiče
    return validPairs > 0 && totalDiff / validPairs > 0;
}

function getShouldReverse(pos: CodeToPosition, parentCode: string, successors: Edge[]) {
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

export function fillEdgeYOffsets(
    edgeYOffsets: EdgeOffsets,
    newDetails: Details,
    plan: Record<string, Array<OrderSubject>>,
    pos: CodeToPosition
) {
    const orGroupEndOffsets: Record<string, number> = {};
    const pathTargetOffsets: Record<string, number> = {};
    Object.values(plan).forEach((semester) => {
        sortByPositions(semester, pos).forEach((subj) => {
            const parentCode = 'code' in subj ? subj.code : subj.choice;
            if (!newDetails[parentCode]) {
                return;
            }
            sortByPositions(newDetails[parentCode].successors, pos).forEach((succ, i) => {
                assignOffsets(
                    parentCode,
                    succ,
                    newDetails,
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

function findRealSuccessor(currentCode: string, details: Details): string {
    if (currentCode.includes('HELPER')) {
        const succs = details[currentCode]?.successors;
        if (succs && succs.length > 0) {
            return findRealSuccessor(succs[0].code, details);
        }
    }
    return currentCode;
}

function sortByPositions<T extends { code: string } | { choice: string }>(
    array: Array<T>,
    pos: CodeToPosition
): Array<T> {
    return [...array].sort((a, b) => {
        const codeA = 'code' in a ? a.code : a.choice;
        const codeB = 'code' in b ? b.code : b.choice;
        const yA = pos[codeA]?.y ?? 0;
        const yB = pos[codeB]?.y ?? 0;
        return yA - yB;
    });
}

function assignOffsets(
    parentCode: string,
    successorInfo: Edge,
    oldDetails: Details,
    edgeYOffsets: Record<string, number>,
    orGroupEndOffsets: Record<string, number>,
    i: number,
    pathTargetOffsets: Record<string, number>,
    pos: CodeToPosition
) {
    const realSuccessorCode = findRealSuccessor(successorInfo.code, oldDetails);
    const isParentHelper = parentCode.startsWith('HELPER');

    const pathKey = getPathCode(parentCode, realSuccessorCode, isParentHelper);

    const myGroup = successorInfo.groups?.find((g) => g.includes(parentCode));
    const definedSubject = myGroup?.find(
        (subj) =>
            pathTargetOffsets[getPathCode(subj, realSuccessorCode, subj.startsWith('HELPER'))] !=
            undefined
    );

    let endOffset: number;

    if (myGroup) {
        if (pathTargetOffsets[pathKey] == undefined) {
            const newOffset = definedSubject
                ? pathTargetOffsets[
                      getPathCode(
                          definedSubject,
                          realSuccessorCode,
                          definedSubject.startsWith('HELPER')
                      )
                  ]
                : getEndOffset(parentCode, realSuccessorCode, oldDetails, pos);

            myGroup.forEach((memberCode) => {
                const memberPathId = getPathCode(
                    memberCode,
                    realSuccessorCode,
                    memberCode.startsWith('HELPER')
                );
                pathTargetOffsets[memberPathId] = newOffset;
            });
        }
        endOffset = pathTargetOffsets[pathKey];
    } else {
        if (isParentHelper) {
            const originalCode = parentCode.replace(/^HELPER_/, '').split('_')[0];
            const originalPathKey = `${originalCode}_${realSuccessorCode}`;
            endOffset =
                pathTargetOffsets[originalPathKey] ??
                getEndOffset(originalCode, realSuccessorCode, oldDetails, pos);
            pathTargetOffsets[pathKey] = endOffset;
        } else {
            endOffset = getEndOffset(parentCode, realSuccessorCode, oldDetails, pos);
            pathTargetOffsets[pathKey] = endOffset;
        }
    }

    let startOffset = (i - (oldDetails[parentCode].successors.length - 1) / 2) * OFFSET_STEP;

    const finalStartOffset = isParentHelper ? endOffset : startOffset;
    const finalEndOffset = endOffset;

    ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, finalStartOffset);
    resolveEndOffset(
        edgeYOffsets,
        orGroupEndOffsets,
        parentCode,
        successorInfo.code,
        successorInfo.groups,
        finalEndOffset,
        successorInfo
    );
}

function getPathCode(startCode: string, endCode: string, isParentHelper: boolean) {
    return isParentHelper
        ? startCode.replace(/^HELPER_/, '').replace(/_\d+$/, '')
        : `${startCode}_${endCode}`;
}

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


function getEndOffset(succCode: string, oldDetails: Details, successorInDegreeCounter: Record<string, number>) : number {
    if (!(succCode in successorInDegreeCounter)) {
        successorInDegreeCounter[succCode] = 0;
    }
    const inDegree = oldDetails[succCode].predecessors.length;
    let endOffset = (successorInDegreeCounter[succCode] - (inDegree - 1) / 2) * OFFSET_STEP;
    successorInDegreeCounter[succCode]++;
    return endOffset;
}


function getNumberOfSuccsBySemester(
    orderData: Record<string, Array<OrderSubject>>,
    infoData: Details,
    codesToSem: Record<string, number>
): Array<number> {
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

export function getYOffsetForOrGroup(
    edgeYOffsets: EdgeOffsets,
    group: Array<string>,
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
