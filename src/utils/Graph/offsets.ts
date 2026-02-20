import { ensureOffset } from '@utils/Graph/dataUtils.js';
import { EdgeOffsets, Details, Edge, OrderSubject, CodeToCoordinates, RealCoordinates, RealPositions, Spec } from '@/types/subjects';
import { Layout } from '@/consts/VisualisationParameters';

const OFFSET_STEP = 12;


export function getOffsets(details: Details, pos: RealPositions, plan: Record<string, Array<OrderSubject>>) {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    fillEdgeYOffsets(edgeYOffsets, details, plan, pos)
    fillEdgeXOffsets(edgeXOffsets, details, plan, pos);
    return [edgeXOffsets, edgeYOffsets];
}


export function fillEdgeXOffsets(edgeXOffsets: EdgeOffsets, infoData: Details,
                                 orderData: Record<string, Array<OrderSubject>>, pos: RealPositions) : void {
    const numberOfSuccsBySemester = getNumberOfSuccsBySemester(orderData, infoData);

    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        const centerOffset = (numberOfSuccsBySemester[Number(semester) - 1] - 1) / 2;
        let edgeIndex = 0;
        subjects.forEach(parent => {
            const parentCode = "code" in parent ? parent.code : parent.choice;
            if (!infoData[parentCode]) { return; }
            const successors = sortSuccessorsByPositions(infoData[parentCode].successors, pos);
            if (successors.length == 0) { return; }

            const shouldReverse = getShouldReverse(pos, parentCode, successors);
            const processedSuccessors = shouldReverse ? [...successors].reverse() : successors;

            processedSuccessors.forEach(successor => {
                if (!infoData[successor.code]) {return;}
                ensureOffset(edgeXOffsets, `${parentCode}-${successor.code}`,
                             (edgeIndex - centerOffset) * Layout.edgeXOffsetStep);
                edgeIndex += 1;
           })
        });
    });
}


function getShouldReverse(pos: RealPositions, parentCode: string, successors: Edge[]) {
    const parentY = pos[parentCode].y ?? 0;
    let totalDiff = 0;
    let validSuccs = 0;

    successors.forEach(s => {
        if (pos[s.code].y !== undefined) {
            totalDiff += (pos[s.code].y - parentY);
            validSuccs++;
        }
    });

    return validSuccs > 0 && (totalDiff / validSuccs) > 0;
}


function getYIndexes(orderData: Record<string, Array<OrderSubject>>) : Record<string, number> {
    const yIndexes: Record<string, number> = {};
    Object.values(orderData).flat().forEach((subject, indexInSemester) => {
        const code = "code" in subject ? subject.code : subject.choice;
        yIndexes[code] = indexInSemester;
    });
    return yIndexes;
}



export function fillEdgeYOffsets(edgeYOffsets: EdgeOffsets, newDetails: Details, plan: Record<string, Array<OrderSubject>>, pos: RealPositions) {
    const orGroupEndOffsets: Record<string, number> = {};
    const successorInDegreeCounter: Record<string, number> = {};
    Object.values(plan).flat().forEach((subj) => {
        const parentCode = "code" in subj ? subj.code : subj.choice;
        if (!newDetails[parentCode]) {return;}
        sortSuccessorsByPositions(newDetails[parentCode].successors, pos).forEach((succ, i) => {
            assignOffsets(parentCode, succ, newDetails, edgeYOffsets, orGroupEndOffsets, successorInDegreeCounter, i);
        })
    })
}


function sortSuccessorsByPositions(successors: Array<Edge>, pos: RealPositions): Array<Edge> {
    return [...successors].sort((a, b) => {
        const yA = pos[a.code]?.y ?? 0;
        const yB = pos[b.code]?.y ?? 0;
        return yA - yB;
    });
}


function assignOffsets(parentCode: string, successorInfo: Edge, 
                       oldDetails: Details, edgeYOffsets: Record<string, number>,
                       orGroupEndOffsets: Record<string, number>, 
                       successorInDegreeCounter: Record<string, number>, i: number) : [number, number] {
    let startOffset = (i - (oldDetails[parentCode].successors.length - 1) / 2) * OFFSET_STEP;
    let endOffset = getEndOffset(successorInfo.code, oldDetails, successorInDegreeCounter);

    ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, startOffset);
    resolveEndOffset(edgeYOffsets, orGroupEndOffsets, parentCode,
                        successorInfo.code, successorInfo.groups, endOffset, successorInfo);
    return [startOffset, endOffset];
}


function resolveEndOffset(edgeYOffsets: EdgeOffsets, orGroupEndOffsets: Record<string, number>,
                          parentCode: string, succCode: string, groups: string[][],
                          offset: number, successorInfo: Edge) : void {
    if (!groups || groups.length == 0) {
        ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-end`, offset);
        return;
    }
    if (orGroupEndOffsets[`${parentCode}-${succCode}`] === undefined) {
        fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
    }
    ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-end`, orGroupEndOffsets[`${parentCode}-${succCode}`]);
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


function getNumberOfSuccsBySemester(orderData: Record<string, Array<OrderSubject>>, infoData: Details) : Array<number> {
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code] || infoData[successor.code].semester == null) {return;}
            numberOfSuccsBySemester[Number(course.semester) - 1] += 1;
        });
    });
    return numberOfSuccsBySemester;
}


export function fillOrGroupOffsets(orGroupEndOffsets: Record<string, number>, edge: Edge, offset: number) : void {
    edge.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[`${codeInGroup}-${edge.code}`] = offset;
        })
    })
}


export function getYOffsetForOrGroup(edgeYOffsets: EdgeOffsets, group: Array<string>, succCode: string) : number | undefined {
    let i = 0;
    while (i < group.length) {
        if (`${group[i]}-${succCode}-end` in edgeYOffsets) {
            return edgeYOffsets[`${group[i]}-${succCode}-end`];
        }
        i++;
    }
    console.warn("No offset found for OR group", group, "to", succCode);
}
