import { addChoiceNodes, isInSomeChoice } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets, fillEdgeYOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { AdvancedSwitch, Course, Details, Edge, EdgeOffsets, Spec, SubjectData } from "@/types/subjects";
import { getReachableCodes } from "./layout";

export function addAuxNodes(subjectData: SubjectData, selectedSpecialization: string, advancedSwitch: AdvancedSwitch) : [Details, Spec] {
    const [newDetails, newOrder, currentSpecializationCodes] = preprocessGraph(subjectData, selectedSpecialization, advancedSwitch);
    const currentPlan = newOrder[selectedSpecialization].plan;
    const subjectsToProcess = Object.values(currentPlan).flat();

    subjectsToProcess.forEach((subject) => {
        const parentCode = "code" in subject ? subject.code : subject.choice;
        if (isInSomeChoice(parentCode, currentPlan, subjectData.choices)) { return;}

        const parent = newDetails[parentCode];
        if (!parent) {
            console.warn(`Course with code ${parentCode} not found in details.`);
            return;
        }
        const currentSuccessors = [...parent.successors];
        currentSuccessors.forEach((successorInfo, i) => {
            const successor = newDetails[successorInfo.code];
            if (isInvalidEdge(parent, successor, currentSpecializationCodes, successorInfo)) { return; }
            if (shouldCreateHelperNodes(parent.semester, successor.semester)) {
                createSuccessingHelperNodes(parentCode, parent.semester, successorInfo.code,
                                            successor.semester, newDetails, currentPlan,
                                            subjectData.choices, successorInfo.groups);
            }
        })
    });
    return [newDetails, newOrder];
}


function isInvalidEdge(parent: Course, successor: Course, currentSpecializationCodes: Set<string>, successorInfo: Edge) : boolean {
    return !successor || successor.semester == null 
        || successor.semester <= (parent.semester ?? 0)
        || !currentSpecializationCodes.has(successorInfo.code.replace(/-\d+$/, ""));
}


function preprocessGraph(subjectData: SubjectData, selectedSpecialization: string, advancedSwitch: AdvancedSwitch) : [Details, Spec, Set<string>] {
    const data = structuredClone(subjectData);

    const updatedData = replaceWithAdvancedCourses(data, advancedSwitch, selectedSpecialization);

    const currentSpecializationCodes = new Set(
        Object.values(updatedData.spec[selectedSpecialization].plan)
            .flat()
            .map(subject => "code" in subject ? subject.code : subject.choice)
    );

    removeEdgesToNonExistingNodes(updatedData.details, currentSpecializationCodes);
    removeIllogicalEdges(updatedData.details);
    
    const newOrder = addChoiceNodes(updatedData.details, updatedData.spec, updatedData.choices, selectedSpecialization);
    removeTransitiveEdges(updatedData.details);

    return [updatedData.details, newOrder, currentSpecializationCodes];
}


function replaceWithAdvancedCourses(subjectData: SubjectData, advancedSwitch: AdvancedSwitch, selectedSpecialization: string) : SubjectData {
    const substitutionCodes = Object.entries(advancedSwitch)
        .filter(([_, toBeReplaced]) => toBeReplaced)
        .map(([code, _]) => code);

    const codesToBeRemoved = substitutionCodes
        .flatMap((code) => subjectData.substitutions[code].removes)
    
    const codesToBeAdded = substitutionCodes
        .flatMap((code) => subjectData.substitutions[code].adds.map((subj) => subj.code))

    const updatedCodes = new Set(Object.keys(subjectData.details));
    codesToBeRemoved.forEach(c => updatedCodes.delete(c));
    codesToBeAdded.forEach(c => updatedCodes.add(c));

    const filteredDetails = Object.fromEntries(
        Object.entries(subjectData.details)
            .filter(([code]) => updatedCodes.has(code))
    );

    const filteredChoices = structuredClone(subjectData.choices);
    Object.values(filteredChoices).forEach((choiceGroup) => {
        choiceGroup.list = choiceGroup.list.filter((choiceSubj) => {
            const subjectCode = typeof choiceSubj === 'string' ? choiceSubj : choiceSubj.code;
            return !codesToBeRemoved.includes(subjectCode);
        });
    });

    const addedSubjectsWithSem = substitutionCodes.flatMap(key => subjectData.substitutions[key].adds);
    const filteredSpec = structuredClone(subjectData.spec);
    const specialization = filteredSpec[selectedSpecialization];
    Object.entries(specialization.plan).forEach(([semKey, subjects]) => {
        let updatedSubjects = subjects.filter((item) => {
            const code = "code" in item ? item.code : item.choice;
            return !codesToBeRemoved.includes(code);
        });
        const toAdd = addedSubjectsWithSem
            .filter(obj => obj.semester.toString() === semKey)
            .map(obj => ({code: obj.code}));

        specialization.plan[semKey] = [...toAdd, ...updatedSubjects];
    });

    return {
        ...subjectData,
        details: filteredDetails,
        choices: filteredChoices,
        spec: filteredSpec // Vrátíš aktualizovaný plán
    };
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
