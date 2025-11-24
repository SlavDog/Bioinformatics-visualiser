import { addChoiceNodes } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { Details, EdgeOffsets, Order, SubjectData } from "@/types/subjects";

export function addHelperNodesAndGetOffsets(subjectData: SubjectData) : [Details, Order, EdgeOffsets, EdgeOffsets] {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    const newOrder = addChoiceNodes(subjectData["details"], subjectData["order"], subjectData["choices"]);
    const newDetails = structuredClone(subjectData["details"]);
    const oldDetails = subjectData["details"];
    const orGroupEndOffsets: Record<string, number> = {};

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const newSuccessors = [...course.successors];
        let parentSemester = course.semester
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor) {return;}

            let offset = (i - (newSuccessors.length - 1) / 2) * 12;
            let succSemester = successor.semester

            ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, offset);

            if (!successorInfo.groups || successorInfo.groups.length == 0) {
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, offset);
            } else {
                if (!orGroupEndOffsets[successorInfo.code]) {
                    fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
                }
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, orGroupEndOffsets[parentCode]);
            }

            if (parentSemester != null && succSemester != null && shouldCreateHelperNodes(parentSemester, succSemester)) {
                createSuccessingHelperNodes(parentCode, parentSemester, successorInfo.code,
                                            succSemester, newDetails, subjectData.order,
                                            edgeYOffsets, offset, offset, successorInfo.groups);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, newOrder);
    return [newDetails, newOrder, edgeXOffsets, edgeYOffsets];
}


function shouldCreateHelperNodes(parentSemester: number | null, 
                                 succSemester: number | null) : boolean {
    return !(parentSemester == null ||
            succSemester == null ||
            parentSemester + 1 == succSemester ||
            parentSemester > succSemester);
}
