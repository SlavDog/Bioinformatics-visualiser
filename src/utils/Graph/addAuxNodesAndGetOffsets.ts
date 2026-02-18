import { addChoiceNodes, isInSomeChoice } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { Course, Details, Edge, EdgeOffsets, Spec, SubjectData } from "@/types/subjects";
import { getReachableCodes } from "./layout";

const OFFSET_STEP = 12;

export function addAuxNodesAndGetOffsets(subjectData: SubjectData, selectedSpecialization: string) : [Details, Spec, EdgeOffsets, EdgeOffsets] {
    const oldDetails = subjectData.details;
    const orGroupEndOffsets: Record<string, number> = {};
    const successorInDegreeCounter: Record<string, number> = {};
    const edgeXOffsets = {};
    const edgeYOffsets = {};

    const [newDetails, newOrder, currentSpecializationCodes] = preprocessGraph(subjectData, selectedSpecialization);
    const currentPlan = newOrder[selectedSpecialization].plan;

    Object.values(currentPlan).flat().forEach((subject) => {
        const parentCode = "code" in subject ? subject.code : subject.choice;
        if (isInSomeChoice(parentCode, currentPlan, subjectData.choices)) { return;}

        const parent = oldDetails[parentCode];
        if (!parent) {
            console.warn(`Course with code ${parentCode} not found in details.`);
            return;
        }
        
        parent.successors.forEach((successorInfo, i) => {
            const successor = oldDetails[successorInfo.code];
            if (isInvalidEdge(parent, successor, currentSpecializationCodes, successorInfo)) { return; }

            const [offset, endOffset] = assignOffsets(parentCode, successorInfo, oldDetails,
                                                      edgeYOffsets, orGroupEndOffsets,
                                                      successorInDegreeCounter, i);

            if (shouldCreateHelperNodes(parent.semester, successor.semester)) {
                createSuccessingHelperNodes(parentCode, parent.semester, successorInfo.code,
                                            successor.semester, newDetails, currentPlan,
                                            subjectData.choices, edgeYOffsets, offset, endOffset, successorInfo.groups);
            }
        })
    });
    fillEdgeXOffsets(edgeXOffsets, newDetails, newOrder[selectedSpecialization].plan);
    return [newDetails, newOrder, edgeXOffsets, edgeYOffsets];
}


function assignOffsets(parentCode: string, successorInfo: Edge, 
                       oldDetails: Details, edgeYOffsets: Record<string, number>,
                       orGroupEndOffsets: Record<string, number>, 
                       successorInDegreeCounter: Record<string, number>, i: number) : [number, number] {
    let offset = (i - (oldDetails[parentCode].successors.length - 1) / 2) * OFFSET_STEP;
    ensureOffset(edgeYOffsets, `${parentCode}-${successorInfo.code}-start`, offset);

    const endOffset = getEndOffset(successorInfo.code, oldDetails, successorInDegreeCounter);
    resolveEndOffset(edgeYOffsets, orGroupEndOffsets, parentCode,
                        successorInfo.code, successorInfo.groups, endOffset, successorInfo);
    return [offset, endOffset];
}


function isInvalidEdge(parent: Course, successor: Course, currentSpecializationCodes: Set<string>, successorInfo: Edge) : boolean {
    return !successor || successor.semester == null 
        || successor.semester <= (parent.semester ?? 0)
        || !currentSpecializationCodes.has(successorInfo.code.replace(/-\d+$/, ""));
}


function preprocessGraph(subjectData: SubjectData, selectedSpecialization: string) : [Details, Spec, Set<string>] {
    const newOrder = addChoiceNodes(subjectData.details, subjectData.spec, subjectData.choices, selectedSpecialization);
    removeIllogicalEdges(subjectData.details);
    removeTransitiveEdges(subjectData.details);

    const currentSpecializationCodes = new Set(Object.values(subjectData.spec[selectedSpecialization].plan)
                                            .flat()
                                            .map(subject => "code" in subject ? subject.code : subject.choice));
    removeEdgesToNonExistingNodes(subjectData.details, currentSpecializationCodes);
    const newDetails = structuredClone(subjectData).details;
    return [newDetails, newOrder, currentSpecializationCodes];
}


function removeEdgesToNonExistingNodes(details: Details, currentSpecializationCodes: Set<string>) : void {
    Object.values(details).forEach((course) => {
        cleanNodeFromNonExistingNodes(true, course, currentSpecializationCodes);
        cleanNodeFromNonExistingNodes(false, course, currentSpecializationCodes);
    });
}


function cleanNodeFromNonExistingNodes(cleanSuccessors: boolean, course: Course, currentSpecializationCodes: Set<string>) : void {
    const key = cleanSuccessors ? "successors" : "predecessors"

    course[key] = course[key].filter(succ => currentSpecializationCodes.has(succ.code.replace(/-\d+$/, "")));
    course[key].forEach(succ => {
        succ.groups = succ.groups.map(group => {
            return group.filter(subject => currentSpecializationCodes.has(subject));
        });
    });
}


function removeIllogicalEdges(details: Details) : void {
    Object.values(details).forEach((course) => {
        cleanNodeFromIllogicalEdges(true, course, details);
        cleanNodeFromIllogicalEdges(false, course, details);
    });
}


function cleanNodeFromIllogicalEdges(cleanSuccessors: boolean, course: Course, details: Details) {
    const key = cleanSuccessors ? "successors" : "predecessors"

    course[key] = course[key].filter(neighbour => {
        const neighbourSemester = details[neighbour.code]?.semester;
        if (course.semester == null || neighbourSemester == null) { return false; }
        if (cleanSuccessors) { return neighbourSemester > course.semester; }
        return neighbourSemester < course.semester;
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
    return parentSemester != null 
        && succSemester != null
        && !(parentSemester == null
        || succSemester == null
        || parentSemester + 1 == succSemester
        || parentSemester > succSemester);
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
