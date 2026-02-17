import { addChoiceNodes, isInSomeChoice } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { Details, Edge, EdgeOffsets, Spec, SubjectData } from "@/types/subjects";
import { getReachableCodes } from "./layout";
import { spec } from "node:test/reporters";

const OFFSET_STEP = 12;

export function addHelperNodesAndGetOffsets(subjectData: SubjectData, selectedSpecialization: string) : [Details, Spec, EdgeOffsets, EdgeOffsets] {
    const oldDetails = subjectData.details;
    const orGroupEndOffsets: Record<string, number> = {};
    const successorInDegreeCounter: Record<string, number> = {};
    const edgeXOffsets = {};
    const edgeYOffsets = {};

    const newOrder = addChoiceNodes(subjectData.details, subjectData.spec, subjectData.choices, selectedSpecialization);
    removeIllogicalEdges(subjectData.details);
    removeTransitiveEdges(subjectData.details);

    const currentSpecializationCodes = new Set(Object.values(subjectData.spec[selectedSpecialization].plan)
                                            .flat()
                                            .map(subject => "code" in subject ? subject.code : subject.choice));
    removeForwardEdgesToNonExistingNodes(subjectData.details, currentSpecializationCodes);
    const newDetails = structuredClone(subjectData).details;

    Object.values(newOrder[selectedSpecialization].plan)
            .flat()
            .map(subject => "code" in subject ? subject.code : subject.choice)
            .filter((parentCode) => !isInSomeChoice(parentCode, newOrder[selectedSpecialization].plan, subjectData.choices))
            .forEach((parentCode) => {
        const course = oldDetails[parentCode];
        if (!course) {
            console.warn(`Course with code ${parentCode} not found in details.`);
            return;
        }
        const { successors: newSuccessors, semester: parentSemester } = course;
        
        newSuccessors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (!successor || successor.semester == null 
                    || successor.semester <= (course.semester ?? 0)
                    || !currentSpecializationCodes.has(successorInfo.code.replace(/-\d+$/, "")))
            {
                return;
            }

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
                                            subjectData.choices, edgeYOffsets, offset, endOffset, groups);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, newOrder[selectedSpecialization].plan);
    return [newDetails, newOrder, edgeXOffsets, edgeYOffsets];
}


function removeForwardEdgesToNonExistingNodes(details: Details, currentSpecializationCodes: Set<string>) : void {
    Object.entries(details).forEach(([code, course]) => {
        course.successors = course.successors.filter(succ => currentSpecializationCodes.has(succ.code.replace(/-\d+$/, "")));
        course.predecessors = course.predecessors.filter(pred => currentSpecializationCodes.has(pred.code.replace(/-\d+$/, "")));
        course.successors.forEach(succ => {
            succ.groups = succ.groups.map(group => {
                return group.filter(subject => currentSpecializationCodes.has(subject));
            });
        });
        course.predecessors.forEach(pred => {
            pred.groups = pred.groups.map(group => {
                return group.filter(subject => currentSpecializationCodes.has(subject));
            });
        });
    });
}



function removeIllogicalEdges(details: Details) : void {
    Object.entries(details).forEach(([code, course]) => {
        const courseSemester = course.semester;
        course.successors = course.successors.filter(succ => {
            const succSemester = details[succ.code]?.semester;
            return !(courseSemester != null && succSemester != null && succSemester <= courseSemester);
        });
        course.predecessors = course.predecessors.filter(pred => {
            const predSemester = details[pred.code]?.semester;
            return !(courseSemester != null && predSemester != null && predSemester >= courseSemester);
        }
        );
    });
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
    });
};


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