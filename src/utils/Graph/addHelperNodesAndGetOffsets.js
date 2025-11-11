import { addChoiceNodes } from "./choiceNodes";
import { parseSemester, ensureOffset } from "./dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "./offsets";
import { createSuccessingHelperNodes } from "./helperNodes";

export function addHelperNodesAndGetOffsets(subjectData) {
    const edgeXOffsets = {};
    const edgeYOffsets = {};
    addChoiceNodes(subjectData["details"], subjectData["order"], subjectData["choices"]);
    const newDetails = structuredClone(subjectData["details"]);
    const oldDetails = subjectData["details"];
    const orGroupEndOffsets = {};

    Object.entries(oldDetails).forEach(([parentCode, course]) => {
        const newSuccessors = [...course.successors];
        let parentSemester = parseSemester(course.semester);
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor) {return;}

            let offset = (i - (newSuccessors.length - 1) / 2) * 12;
            let succSemester = parseSemester(successor.semester);

            ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, offset);

            if (!successorInfo.groups || successorInfo.groups.length == 0) {
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, offset);
            } else {
                if (!orGroupEndOffsets[successorInfo.code]) {
                    fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset);
                }
                ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-end`, orGroupEndOffsets[parentCode]);
            }

            if (shouldCreateHelperNodes(parentSemester, succSemester)) {
                createSuccessingHelperNodes(parentCode, parentSemester, successorInfo.code,
                                            succSemester, newDetails, subjectData,
                                            edgeYOffsets, offset, offset, successorInfo.groups);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, subjectData["order"]);
    return [newDetails, edgeXOffsets, edgeYOffsets];
}


function shouldCreateHelperNodes(parentSemester, succSemester) {
    return !(parentSemester == null || 
            succSemester == null ||
            parentSemester + 1 == succSemester || 
            parentSemester > succSemester);
}
