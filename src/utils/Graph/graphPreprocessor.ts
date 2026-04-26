import { addChoiceNodes, isInSomeChoice } from '@utils/Graph/choiceNodes';
import { createSuccessingHelperNodes } from '@utils/Graph/helperNodes';
import {
    Choices,
    Course,
    Details,
    Edge,
    OrderSubject,
    Plan,
    Spec,
    SubjectData,
    Substitutions
} from '@/types';
import { getReachableCodes } from './layout';

/**
 * Main entry point for graph preprocessing.
 * Preprocesses the raw subject data by applying substitutions, removing edges to non-existing nodes,
 * removing illogical edges, adding choice nodes, and removing transitive edges.
 * Adds helper nodes for edges spanning multiple semesters,
 * sorts subjects within each semester by successor count,
 * and returns the updated details and spec.
 *
 * @warn Mutates `codesToSem` in place when helper nodes are added.
 *
 * @param data - Raw subject data.
 * @param selectedSpecialization - Key of the active specialization.
 * @param activeSubstitutions - Set of active substitution keys.
 * @param codesToSem - Mutable mapping of subject codes to semesters.
 * @returns Tuple of updated details and spec.
 */
export function buildProcessedGraph(
    data: SubjectData,
    selectedSpecialization: string,
    activeSubstitutions: Set<string>,
    codesToSem: Record<string, number>
): [Details, Spec] {
    const [newDetails, newOrder, currentSpecializationCodes] = preprocessGraph(
        data,
        selectedSpecialization,
        activeSubstitutions,
        codesToSem
    );
    const currentPlan = newOrder[selectedSpecialization].plan;
    const subjectsToProcess = Object.values(currentPlan).flat();

    subjectsToProcess.forEach((subject) => {
        const parentCode = 'code' in subject ? subject.code : subject.choice;

        if (isInSomeChoice(parentCode, currentPlan, data.choices)) {
            return;
        }

        const parent = newDetails[parentCode];
        if (!parent) {
            console.warn(`Course with code ${parentCode} not found in details.`);
            return;
        }
        const currentSuccessors = [...parent.successors];
        currentSuccessors.forEach((successorInfo, i) => {
            const successor = newDetails[successorInfo.code];

            if (
                isInvalidEdge(
                    parentCode,
                    successor,
                    currentSpecializationCodes,
                    successorInfo,
                    codesToSem
                )
            ) {
                return;
            }

            if (shouldCreateHelperNodes(codesToSem[parentCode], codesToSem[successorInfo.code])) {
                createSuccessingHelperNodes(
                    parentCode,
                    codesToSem[parentCode],
                    successorInfo.code,
                    codesToSem[successorInfo.code],
                    newDetails,
                    currentPlan,
                    data.choices,
                    successorInfo.groups,
                    codesToSem
                );
            }
        });
    });

    // Sort subjects in each semester by number of successors (descending)
    Object.keys(newOrder[selectedSpecialization].plan).forEach((sem) => {
        newOrder[selectedSpecialization].plan[Number(sem)].sort((a, b) => {
            const codeA = 'code' in a ? a.code : a.choice;
            const codeB = 'code' in b ? b.code : b.choice;
            const succsA = newDetails[codeA]?.successors?.length ?? 0;
            const succsB = newDetails[codeB]?.successors?.length ?? 0;
            return succsB - succsA;
        });
    });

    return [newDetails, newOrder];
}

/**
 * Returns true if an edge should not be processed —
 * i.e. the successor is missing, has no semester, is in an earlier semester,
 * or is not part of the current specialization.
 */
function isInvalidEdge(
    parentCode: string,
    successor: Course,
    currentSpecializationCodes: Set<string>,
    successorInfo: Edge,
    codesToSem: Record<string, number>
): boolean {
    return (
        !successor ||
        codesToSem[successorInfo.code] == null ||
        codesToSem[successorInfo.code] <= (codesToSem[parentCode] ?? 0) ||
        !currentSpecializationCodes.has(successorInfo.code.replace(/-\d+$/, ''))
    );
}

/**
 * Preprocesses the graph by applying substitutions, removing invalid edges,
 * adding choice nodes, and removing transitive edges.
 *
 * @returns Tuple of [details, updated spec, set of codes in current specialization].
 */
function preprocessGraph(
    data: SubjectData,
    selectedSpecialization: string,
    activeSubstitutions: Set<string>,
    codesToSem: Record<string, number>
): [Details, Spec, Set<string>] {
    const dataCopy = structuredClone(data);

    const updatedData = replaceWithAdvancedCourses(
        dataCopy,
        activeSubstitutions,
        selectedSpecialization
    );

    const currentSpecializationCodes = new Set(
        Object.values(updatedData.spec[selectedSpecialization].plan)
            .flat()
            .map((subject) => ('code' in subject ? subject.code : subject.choice))
    );

    removeEdgesToNonExistingNodes(updatedData, currentSpecializationCodes, selectedSpecialization);
    removeIllogicalEdges(updatedData.details, codesToSem);

    const newOrder = addChoiceNodes(
        updatedData.details,
        updatedData.spec,
        updatedData.choices,
        selectedSpecialization
    );
    removeTransitiveEdges(updatedData.details);

    return [updatedData.details, newOrder, currentSpecializationCodes];
}

/**
 * Applies active substitutions to the subject data —
 * removes substituted subjects and adds replacement subjects to details, choices, and plan.
 */
function replaceWithAdvancedCourses(
    data: SubjectData,
    activeSubstitutions: Set<string>,
    selectedSpecialization: string
): SubjectData {
    const substitutionCodes = Array.from(activeSubstitutions);

    const codesToBeRemoved = substitutionCodes.flatMap((code) => data.substitutions[code].removes);

    const codesToBeAdded = substitutionCodes.flatMap((code) =>
        data.substitutions[code].adds.map((subj) => subj.code)
    );

    const updatedCodes = new Set(Object.keys(data.details));
    codesToBeRemoved.forEach((c) => updatedCodes.delete(c));
    codesToBeAdded.forEach((c) => updatedCodes.add(c));

    const filteredDetails = Object.fromEntries(
        Object.entries(data.details).filter(([code]) => updatedCodes.has(code))
    );

    const filteredChoices = structuredClone(data.choices);
    Object.values(filteredChoices).forEach((choiceGroup) => {
        choiceGroup.list = choiceGroup.list.filter((choiceSubj) => {
            const subjectCode = typeof choiceSubj === 'string' ? choiceSubj : choiceSubj.code;
            return !codesToBeRemoved.includes(subjectCode);
        });
    });

    const addedSubjectsWithSem = substitutionCodes.flatMap((key) => data.substitutions[key].adds);
    const filteredSpec = structuredClone(data.spec);
    const specialization = filteredSpec[selectedSpecialization];
    Object.entries(specialization.plan).forEach(([semKey, subjects]) => {
        let updatedSubjects = subjects.filter((item) => {
            const code = 'code' in item ? item.code : item.choice;
            return !codesToBeRemoved.includes(code);
        });
        const toAdd = addedSubjectsWithSem
            .filter((obj) => obj.semester.toString() === semKey)
            .map((obj) => ({ code: obj.code }));

        specialization.plan[semKey] = [...toAdd, ...updatedSubjects];
    });

    return {
        ...data,
        details: filteredDetails,
        choices: filteredChoices,
        spec: filteredSpec
    };
}

/**
 * Removes edges pointing to nodes outside the current specialization.
 * Also populates `unshownNeededPredecessors` for nodes with hidden required predecessors.
 *
 * Modifies `data.details` in place.
 */
function removeEdgesToNonExistingNodes(
    data: SubjectData,
    currentSpecializationCodes: Set<string>,
    selectedSpecialization: string
): void {
    Object.values(data.details).forEach((course) => {
        cleanNodeFromNonExistingNodes(
            true,
            course,
            currentSpecializationCodes,
            data,
            selectedSpecialization
        );
        cleanNodeFromNonExistingNodes(
            false,
            course,
            currentSpecializationCodes,
            data,
            selectedSpecialization
        );
    });
}

function cleanNodeFromNonExistingNodes(
    cleanSuccessors: boolean,
    course: Course,
    currentSpecializationCodes: Set<string>,
    data: SubjectData,
    selectedSpecialization: string
): void {
    const key = cleanSuccessors ? 'successors' : 'predecessors';

    if (key == 'predecessors') {
        course.unshownNeededPredecessors = course[key]
            .filter(
                (neighbour) =>
                    !currentSpecializationCodes.has(neighbour.code.replace(/-\d+$/, '')) &&
                    neighbour.groups.every((group) =>
                        group.every(
                            (code) =>
                                !currentSpecializationCodes.has(code.replace(/-\d+$/, '')) &&
                                !isInSomeChoice(
                                    code,
                                    data.spec[selectedSpecialization].plan,
                                    data.choices
                                )
                        )
                    ) &&
                    !isInSomeChoice(
                        neighbour.code,
                        data.spec[selectedSpecialization].plan,
                        data.choices
                    ) &&
                    neighbour.by_prerequisites == true
            )
            .map((edge) => edge.code);
        if (
            course.unshownNeededPredecessors.length > 0 &&
            currentSpecializationCodes.has(course.name)
        ) {
            console.warn(
                `Course ${course.name} lacks predecessors: ${course.unshownNeededPredecessors.join(', ')}`
            );
        }
    }
    course[key] = course[key].filter((succ) =>
        currentSpecializationCodes.has(succ.code.replace(/-\d+$/, ''))
    );
    course[key].forEach((succ) => {
        succ.groups = succ.groups.map((group) => {
            return group.filter((subject) => currentSpecializationCodes.has(subject));
        });
    });
}

/**
 * Removes edges where the neighbour is in an earlier semester than expected
 * (successors in earlier semesters, predecessors in later semesters).
 * Logs warnings/errors for removed edges.
 *
 * Modifies `details` in place.
 */
function removeIllogicalEdges(details: Details, codesToSem: Record<string, number>): void {
    Object.entries(details).forEach(([code, course]) => {
        cleanNodeFromIllogicalEdges(true, code, course, codesToSem);
        cleanNodeFromIllogicalEdges(false, code, course, codesToSem);
    });
}

function cleanNodeFromIllogicalEdges(
    cleanSuccessors: boolean,
    code: string,
    course: Course,
    codesToSem: Record<string, number>
) {
    const key = cleanSuccessors ? 'successors' : 'predecessors';
    const courseSemester = codesToSem[code];
    course[key] = course[key].filter((neighbour) => {
        const neighbourSemester = codesToSem[neighbour.code];
        if (courseSemester == null || neighbourSemester == null) {
            return false;
        }
        if (cleanSuccessors) {
            if (neighbourSemester < courseSemester) {
                if (neighbour.by_prerequisites) {
                    console.error(
                        `Removing illogical by-prerequisites successor edge from ${code} (sem ${courseSemester}) to ${neighbour.code} (sem ${neighbourSemester})`
                    );
                } else {
                    console.warn(
                        `Removing illogical non-prerequisite successor edge from ${code} (sem ${courseSemester}) to ${neighbour.code} (sem ${neighbourSemester})`
                    );
                }
            }
            return neighbourSemester > courseSemester;
        }
        if (neighbourSemester > courseSemester) {
            if (neighbour.by_prerequisites) {
                console.error(
                    `Removing illogical by-prerequisites predecessor edge from ${code} (sem ${courseSemester}) to ${neighbour.code} (sem ${neighbourSemester})`
                );
            } else {
                console.warn(
                    `Removing illogical non-prerequisite predecessor edge from ${code} (sem ${courseSemester}) to ${neighbour.code} (sem ${neighbourSemester})`
                );
            }
        }
        return neighbourSemester < courseSemester;
    });
}

/**
 * Removes transitive edges — edges where a shorter path already exists
 * through intermediate nodes.
 * Also cleans OR-groups to remove codes no longer connected by direct edges.
 *
 * Modifies `details` in place.
 * ensure semester values are consistently typed as numbers.
 */
function removeTransitiveEdges(details: Details): void {
    Object.keys(details).forEach((code) => {
        const successors = details[code].successors;
        if (!successors || successors.length == 0) {
            return;
        }

        const redundantCodes = new Set<string>();

        successors.forEach((succ) => {
            const reachable = getReachableCodes(succ.code, details, false);
            reachable
                .filter((reachableCode) => reachableCode != succ.code)
                .forEach((code) => redundantCodes.add(code));
        });

        details[code].successors = successors.filter((succ) => !redundantCodes.has(succ.code));

        redundantCodes.forEach((redundantCode) => {
            if (details[redundantCode]) {
                details[redundantCode].predecessors = details[redundantCode].predecessors.filter(
                    (pred) => pred.code !== code
                );
            }
        });
    });

    // Clean OR-groups to remove codes no longer connected by direct edges
    Object.keys(details).forEach((code) => {
        const node = details[code];

        node.successors.forEach((succ) => {
            if (succ.groups) {
                succ.groups = succ.groups
                    .map((group) =>
                        group.filter(
                            (mCode) =>
                                details[mCode] &&
                                details[mCode].successors.some((edge) => edge.code === succ.code)
                        )
                    )
                    .filter((group) => group.length > 1);
            }
        });

        node.predecessors.forEach((pred) => {
            if (pred.groups) {
                pred.groups = pred.groups
                    .map((group) =>
                        group.filter(
                            (mCode) =>
                                details[mCode] &&
                                details[mCode].successors.some((edge) => edge.code === code)
                        )
                    )
                    .filter((group) => group.length > 1);
            }
        });
    });
}

/**
 * Creates duplicate entries in `details` for subjects appearing multiple times
 * in the plan (suffixed with `-DUP-{semester}`).
 */
export function createDuplicateSubjectDetails(
    subjectInfoData: SubjectData,
    dedupedPlan: Plan,
    selectedSpecialization: string
): SubjectData {
    const patchedData = structuredClone(subjectInfoData);

    Object.keys(dedupedPlan).forEach((sem) => {
        dedupedPlan[sem].forEach((subject) => {
            if ('code' in subject && subject.code.includes('-DUP-')) {
                const originalCode = subject.code.split('-DUP-')[0];
                patchedData.details[subject.code] = structuredClone(
                    patchedData.details[originalCode]
                );
            }
        });
    });

    patchedData.spec[selectedSpecialization].plan = dedupedPlan;
    return patchedData;
}

/**
 * Builds a mapping of subject codes to their semester numbers,
 * and returns a deduplicated plan where duplicate subjects are suffixed with `-DUP-{semester}`.
 *
 * Also maps all subjects within a choice block to the same semester as the choice.
 * Substitution subjects are mapped to their explicitly defined semesters.
 *
 * @returns Tuple of [codesToSem map, deduplicated plan].
 */
export function getCodesToSem(
    choices: Choices,
    plan: Plan,
    substitutions: Substitutions
): [Record<string, number>, Plan] {
    const result: Record<string, number> = {};
    const seen = new Set<string>();
    const newPlan: Plan = {};

    Object.entries(plan).forEach(([semesterNumber, semester]) => {
        newPlan[semesterNumber] = [];
        semester.forEach((subject) => {
            let code = 'code' in subject ? subject.code : `${subject.choice}-${semesterNumber}`;

            if (seen.has(code)) {
                code = `${code}-DUP-${semesterNumber}`;
            }
            seen.add(code);

            newPlan[semesterNumber].push('code' in subject ? { code } : subject);
            result[code] = Number(semesterNumber);

            if (!('code' in subject)) {
                choices[subject.choice].list.forEach((choiceSubject) => {
                    if (typeof choiceSubject === 'string') {
                        result[choiceSubject] = Number(semesterNumber);
                    }
                });
            }
        });
    });

    Object.values(substitutions).forEach((substitution) =>
        substitution.adds.forEach((subject) => (result[subject.code] = subject.semester))
    );

    return [result, newPlan];
}

/**
 * Returns true if helper nodes should be created between two semesters —
 * i.e. they are more than one semester apart.
 */
function shouldCreateHelperNodes(
    parentSemester: number | null,
    succSemester: number | null
): boolean {
    if (parentSemester == null || succSemester == null) return false;
    return succSemester - parentSemester > 1;
}
