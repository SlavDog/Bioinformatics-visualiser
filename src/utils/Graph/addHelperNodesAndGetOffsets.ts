import { addChoiceNodes } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { Details, Edge, EdgeOffsets, Spec, SubjectData } from "@/types/subjects";
import { getReachableCodes } from "./layout";

const OFFSET_STEP = 12;

export function addHelperNodesAndGetOffsets(subjectData: SubjectData, selectedSpecialization: string) : [Details, Spec, EdgeOffsets, EdgeOffsets] {
    const oldDetails = subjectData.details;
    const orGroupEndOffsets: Record<string, number> = {};
    const successorInDegreeCounter: Record<string, number> = {};
    const edgeXOffsets = {};
    const edgeYOffsets = {};

    const newOrder = addChoiceNodes(subjectData.details, subjectData.spec, subjectData.choices, selectedSpecialization);
    removeTransitiveEdges(subjectData.details);
    const newDetails = structuredClone(subjectData.details);

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const { successors: newSuccessors, semester: parentSemester } = course;
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor || successor.semester == null || successor.semester <= (course.semester ?? 0)) {return;}

            const { code: succCode, groups } = successorInfo;
            let succSemester = successor.semester

            // Assign start and end offsets
            let offset = (i - (newSuccessors.length - 1) / 2) * OFFSET_STEP;
            ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-start`, offset);

            const endOffset = getEndOffset(succCode, oldDetails, successorInDegreeCounter);
            resolveEndOffset(edgeYOffsets, orGroupEndOffsets, parentCode,
                             succCode, groups, endOffset, successorInfo);

            if (parentSemester != null && succSemester != null
                    && shouldCreateHelperNodes(parentSemester, succSemester)) {
                createSuccessingHelperNodes(parentCode, parentSemester, succCode,
                                            succSemester, newDetails, newOrder[selectedSpecialization].plan,
                                            edgeYOffsets, offset, endOffset, groups,
                                            selectedSpecialization);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, newOrder[selectedSpecialization].plan);
    return [newDetails, newOrder, edgeXOffsets, edgeYOffsets];
}


function removeTransitiveEdges(details: Details) : void {
    Object.keys(details).forEach(code => {
        const successors = details[code].successors;
        if (!successors || successors.length == 0) return;
        const redundantCodes = new Set<string>();
        successors.forEach(succ => {
            const reachable = getReachableCodes(succ.code, details, false);
            reachable
                .filter(reachableCode => reachableCode != succ.code)
                .forEach(code => redundantCodes.add(code));
        });

        details[code].successors = successors.filter(succ => !redundantCodes.has(succ.code));

        redundantCodes.forEach(redundantCode => {
            if (details[redundantCode]) {
                details[redundantCode].predecessors = details[redundantCode].predecessors
                    .filter(pred => pred.code !== code);
            }
        });
    })
}


function shouldCreateHelperNodes(parentSemester: number | null, 
                                 succSemester: number | null) : boolean {
    return !(parentSemester == null ||
            succSemester == null ||
            parentSemester + 1 == succSemester ||
            parentSemester > succSemester);
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