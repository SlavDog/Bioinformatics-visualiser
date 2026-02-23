import { addChoiceNodes, isInSomeChoice } from "@utils/Graph/choiceNodes";
import { ensureOffset } from "@utils/Graph/dataUtils";
import { fillOrGroupOffsets, fillEdgeXOffsets, fillEdgeYOffsets } from "@utils/Graph/offsets";
import { createSuccessingHelperNodes } from "@utils/Graph/helperNodes";
import { AdvancedSwitch, Course, Details, Edge, EdgeOffsets, OrderSubject, Spec, SubjectData, Substitutions } from "@/types/subjects";
import { getReachableCodes } from "./layout";

export function addAuxNodes(subjectData: SubjectData, selectedSpecialization: string, advancedSwitch: AdvancedSwitch, codesToSem: Record<string, number>) : [Details, Spec] {
    const [newDetails, newOrder, currentSpecializationCodes] = preprocessGraph(subjectData, selectedSpecialization, advancedSwitch, codesToSem);
    const currentPlan = newOrder[selectedSpecialization].plan;
    const subjectsToProcess = Object.values(currentPlan).flat();

    subjectsToProcess.forEach((subject) => {
        const parentCode = "code" in subject ? subject.code : subject.choice;
        const parentSem = codesToSem[parentCode];
        if (isInSomeChoice(parentCode, currentPlan, subjectData.choices)) { return;}

        const parent = newDetails[parentCode];
        if (!parent) {
            console.warn(`Course with code ${parentCode} not found in details.`);
            return;
        }
        const currentSuccessors = [...parent.successors];
        currentSuccessors.forEach((successorInfo) => {
            const successor = newDetails[successorInfo.code];
            const successorSem = codesToSem[successorInfo.code];
            if (isInvalidEdge(parentCode, successor, currentSpecializationCodes, successorInfo, codesToSem)) { return; }
            if (shouldCreateHelperNodes(parentSem, successorSem)) {
                createSuccessingHelperNodes(parentCode, parentSem, successorInfo.code,
                                            successorSem, newDetails, currentPlan,
                                            subjectData.choices, successorInfo.groups, codesToSem);
            }
        })
    });
    return [newDetails, newOrder];
}


export function getCodesToSem(plan: Record<string, Array<OrderSubject>>, substitutions: Substitutions) : Record<string,number> {
    const result: Record<string, number> = {};
    Object.entries(plan)
        .forEach(([semesterNumber, semester]) => semester
            .forEach((subject) => result["code" in subject ? subject.code : `${subject.choice}-${semesterNumber}`] = Number(semesterNumber)))
    Object.values(substitutions).forEach((substitution) => substitution.adds.forEach(subject => result[subject.code] = subject.semester))
    return result;
}


function isInvalidEdge(parentCode: string, successor: Course, 
                       currentSpecializationCodes: Set<string>,
                       successorInfo: Edge,
                       codesToSem: Record<string, number>) : boolean {
    const successorSem = codesToSem[successorInfo.code];
    return !successor || successorSem == null 
        || successorSem <= (codesToSem[parentCode] ?? 0)
        || !currentSpecializationCodes.has(successorInfo.code.replace(/-\d+$/, ""));
}


function preprocessGraph(subjectData: SubjectData, selectedSpecialization: string, advancedSwitch: AdvancedSwitch, codesToSem: Record<string, number>) : [Details, Spec, Set<string>] {
    const data = structuredClone(subjectData);

    const updatedData = replaceWithAdvancedCourses(data, advancedSwitch, selectedSpecialization);

    const currentSpecializationCodes = new Set(
        Object.values(updatedData.spec[selectedSpecialization].plan)
            .flat()
            .map(subject => "code" in subject ? subject.code : subject.choice)
    );

    removeEdgesToNonExistingNodes(updatedData, currentSpecializationCodes, selectedSpecialization);
    removeIllogicalEdges(updatedData.details, codesToSem);
    
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
        spec: filteredSpec
    };
}


function removeEdgesToNonExistingNodes(data: SubjectData, currentSpecializationCodes: Set<string>, selectedSpecialization: string) : void {
    Object.values(data.details).forEach((course) => {
        cleanNodeFromNonExistingNodes(true, course, currentSpecializationCodes, data, selectedSpecialization);
        cleanNodeFromNonExistingNodes(false, course, currentSpecializationCodes, data, selectedSpecialization);
    });
}


function cleanNodeFromNonExistingNodes(cleanSuccessors: boolean, course: Course, currentSpecializationCodes: Set<string>, data: SubjectData, selectedSpecialization: string) : void {
    const key = cleanSuccessors ? "successors" : "predecessors"

    if (key == "predecessors") { 
        course.unshownNeededPredecessors = course[key]
            .filter((neighbour) =>
                !currentSpecializationCodes.has(neighbour.code.replace(/-\d+$/, ""))
                && neighbour.groups.every((group) => group
                    .every((code) => !currentSpecializationCodes.has(code.replace(/-\d+$/, "")) 
                        && !isInSomeChoice(code, data.spec[selectedSpecialization].plan, data.choices)))
                && !isInSomeChoice(neighbour.code, data.spec[selectedSpecialization].plan, data.choices) 
                && neighbour.by_prerequisites == true)
            .map((edge) => edge.code);
    }
    course[key] = course[key].filter(succ => currentSpecializationCodes.has(succ.code.replace(/-\d+$/, "")));
    course[key].forEach(succ => {
        succ.groups = succ.groups.map(group => {
            return group.filter(subject => currentSpecializationCodes.has(subject));
        });
    });
}


function removeIllogicalEdges(details: Details, codesToSem: Record<string, number>) : void {
    Object.entries(details).forEach(([code, course]) => {
        cleanNodeFromIllogicalEdges(true, code, course, details, codesToSem);
        cleanNodeFromIllogicalEdges(false, code, course, details, codesToSem);
    });
}


function cleanNodeFromIllogicalEdges(cleanSuccessors: boolean, code: string, course: Course, details: Details, codesToSem: Record<string, number>) {
    const key = cleanSuccessors ? "successors" : "predecessors"
    const courseSem = codesToSem[code];
    course[key] = course[key].filter(neighbour => {
        const neighbourSemester = codesToSem[neighbour.code];
        if (courseSem == null || neighbourSemester == null) { return false; }
        if (cleanSuccessors) { return neighbourSemester > courseSem; }
        return neighbourSemester < courseSem;
    });
}


function removeTransitiveEdges(details: Details) : void {
    Object.keys(details).forEach(code => {
        const successors = details[code].successors;
        if (!successors || successors.length == 0) { return; }
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

    Object.keys(details).forEach(code => {
        const node = details[code];

        node.successors.forEach(succ => {
            if (succ.groups) {
                succ.groups = succ.groups.map(group => 
                    group.filter(mCode => 
                        details[mCode] && details[mCode].successors.some(edge => edge.code === succ.code)
                    )
                ).filter(group => group.length > 1);
            }
        });

        node.predecessors.forEach(pred => {
            if (pred.groups) {
                pred.groups = pred.groups.map(group => 
                    group.filter(mCode => 
                        details[mCode] && details[mCode].successors.some(edge => edge.code === code)
                    )
                ).filter(group => group.length > 1);
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
