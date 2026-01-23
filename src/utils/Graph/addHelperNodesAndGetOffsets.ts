import { addChoiceNodes } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { Details, Edge, EdgeOffsets, Order, SubjectData } from "@/types/subjects";

export function addHelperNodesAndGetOffsets(subjectData: SubjectData, selectedSpecialization: string) : [Details, Order, EdgeOffsets, EdgeOffsets] {
    const oldDetails = subjectData.details;
    const orGroupEndOffsets: Record<string, number> = {};
    const edgeXOffsets = {};
    const edgeYOffsets = {};

    const newOrder = addChoiceNodes(subjectData.details, subjectData.order, subjectData.choices, selectedSpecialization);
    const newDetails = structuredClone(subjectData.details);

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const { successors: newSuccessors, semester: parentSemester } = course;
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor) {return;}

            const { code: succCode, groups } = successorInfo;
            let succSemester = successor.semester

            // Assign start and end offsets
            let offset = (i - (newSuccessors.length - 1) / 2) * 12;
            ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-start`, offset);
            resolveEndOffset(edgeYOffsets, orGroupEndOffsets, parentCode,
                             succCode, groups, offset, successorInfo);

            if (parentSemester != null && succSemester != null
                    && shouldCreateHelperNodes(parentSemester, succSemester)) {
                createSuccessingHelperNodes(parentCode, parentSemester, succCode,
                                            succSemester, newDetails, newOrder[selectedSpecialization],
                                            edgeYOffsets, offset, offset, groups,
                                            selectedSpecialization);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, newOrder[selectedSpecialization]);
    return [newDetails, newOrder, edgeXOffsets, edgeYOffsets];
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
    if (!orGroupEndOffsets[succCode]) {
        fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
    }
    ensureOffset(edgeYOffsets, `${parentCode}-${succCode}-end`, orGroupEndOffsets[parentCode]);
}