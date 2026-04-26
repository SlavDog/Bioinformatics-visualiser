import { Choice, Choices, OrderSubject, Details, Edge, Spec } from '@/types';
import { emptyNode } from '@/consts/VisualisationParameters';

/**
 * Adds virtual choice nodes to the subject graph for a given specialization.
 * All subjects from every choice block in the plan is replaced by a single choice
 * node that aggregates the predecessors and successors of all subjects in that choice.
 *
 * Modifies `details` in place, returns a cloned and updated `spec`.
 *
 * @param details - Catalog of all subjects and their metadata.
 * @param spec - Specification of study specializations.
 * @param choices - Available choices.
 * @param selectedSpecialization - Key of the active specialization.
 * @returns Updated spec with choice nodes inserted into the plan.
 */
export function addChoiceNodes(
    details: Details,
    spec: Spec,
    choices: Choices,
    selectedSpecialization: string
): Spec {
    const newOrder = structuredClone(spec);
    const plan = spec[selectedSpecialization].plan;

    Object.entries(plan).forEach(([semester, subjectList]) => {
        const semesterNumber = Number(semester);
        subjectList
            .filter((subject) => 'choice' in subject)
            .forEach((choiceSubject) => {
                const choiceCode = choiceSubject.choice;
                const isSpecialChoice = choiceCode.includes('core') || choiceCode.includes('tv');
                const successors = isSpecialChoice
                    ? []
                    : connectNeighbours(
                          true,
                          choices[choiceCode],
                          details,
                          choiceCode,
                          semesterNumber
                      );
                const predecessors = isSpecialChoice
                    ? []
                    : connectNeighbours(
                          false,
                          choices[choiceCode],
                          details,
                          choiceCode,
                          semesterNumber
                      );
                saveChoiceNode(
                    details,
                    newOrder,
                    choiceCode,
                    choiceSubject,
                    semesterNumber,
                    choices,
                    successors,
                    predecessors,
                    selectedSpecialization
                );
            });
    });
    return newOrder;
}

/**
 * Connects a choice node to its neighbours (either successors or predecessors)
 * by aggregating edges from all subjects in the choice list.
 *
 * Removes direct links between choice subjects and their neighbours,
 * replacing them with links to the choice node.
 * Also updates OR-groups to replace choice subjects with the choice node.
 *
 * Modifies `details` in place.
 *
 * @param connectSuccs - If true, connects successors; otherwise predecessors.
 * @param subjChoices - The choice definition containing the subject list.
 * @param details - Catalog of all subjects and their metadata.
 * @param choiceCode - Base code of the choice block.
 * @param semester - Semester number of the choice block.
 * @returns Array of unique neighbour edges connected to the choice node.
 */
function connectNeighbours(
    connectSuccs: boolean,
    subjChoices: Choice,
    details: Details,
    choiceCode: string,
    semester: number
): Edge[] {
    const key = connectSuccs ? 'successors' : 'predecessors';
    const inverseKey = connectSuccs ? 'predecessors' : 'successors';
    const choiceNodeCode = `${choiceCode}-${semester}`;

    const choiceListCodes = new Set(
        subjChoices.list.map((item) => (typeof item === 'string' ? item : item.code))
    );

    // Collect all neighbours of choice subjects, filter out unknown codes, deduplicate by code
    const allNeighbours = subjChoices.list
        .flatMap((item) => {
            const code = typeof item === 'string' ? item : item.code;
            return details[code][key] || [];
        })
        .filter((edge) => edge.code in details);

    const uniqueNeighbours = allNeighbours.filter(
        (value, index, self) => index === self.findIndex((t) => t.code === value.code)
    );

    uniqueNeighbours.forEach((neighbour) => {
        const neighbourNode = details[neighbour.code];

        const shouldDrawFullLine = details[neighbour.code][inverseKey]
            .filter((subject) => choiceListCodes.has(subject.code))
            .some((subject) => subject.by_prerequisites);

        // Remove direct links to same choice subjects
        neighbourNode[inverseKey] = neighbourNode[inverseKey].filter(
            (subject) => !choiceListCodes.has(subject.code)
        );

        // Add a new link to choice node if not already present
        if (!neighbourNode[inverseKey].some((succ) => succ.code == choiceNodeCode)) {
            neighbourNode[inverseKey].push({
                code: choiceNodeCode,
                groups: neighbour.groups,
                by_prerequisites: shouldDrawFullLine
            });
        }
    });

    if (connectSuccs) {
        replaceChoiceSubjectsInGroups(
            uniqueNeighbours,
            choiceNodeCode,
            choiceListCodes,
            details,
            inverseKey
        );
    }
    return uniqueNeighbours;
}

/**
 * Replaces references to choice subjects in OR-groups of successor nodes
 * with the choice node code.
 *
 * @warn Modifies `details` and `neighboursArray` edges in place.
 */
function replaceChoiceSubjectsInGroups(
    neighboursArray: Edge[],
    choiceNodeCode: string,
    choiceListCodes: Set<string>,
    details: Details,
    inverseKey: 'successors' | 'predecessors'
) {
    neighboursArray.forEach((neighbourEdge) => {
        neighbourEdge.groups = substituteChoiceCodes(
            neighbourEdge.groups,
            choiceListCodes,
            choiceNodeCode
        );

        const neighbourNode = details[neighbourEdge.code];
        if (!neighbourNode) {
            return;
        }

        neighbourNode[inverseKey] = neighbourNode[inverseKey].map((edge) => {
            if (edge.code === choiceNodeCode) {
                return {
                    ...edge,
                    groups: substituteChoiceCodes(edge.groups, choiceListCodes, choiceNodeCode)
                };
            }
            return edge;
        });
    });
}

/**
 * Replaces any choice subject codes within OR-groups with the choice node code.
 * Groups containing choice subjects are cleaned and the choice node code is appended.
 */
function substituteChoiceCodes(
    groups: string[][],
    choiceListCodes: Set<string>,
    choiceNodeCode: string
) {
    return groups.map((group) => {
        const containsSubject = group.some((subject) => choiceListCodes.has(subject));
        if (!containsSubject) {
            return group;
        }
        return [...group.filter((subject) => !choiceListCodes.has(subject)), choiceNodeCode];
    });
}

/**
 * Creates and stores a choice node in `details` and updates the plan in `spec`.
 * Replaces the original choice entry in the plan with one referencing the new node code.
 *
 * Modifies `details` and `spec` in place.
 */
function saveChoiceNode(
    details: Details,
    spec: Spec,
    choiceCode: string,
    orderSubject: OrderSubject,
    semester: number,
    choices: Choices,
    successors: Array<Edge>,
    predecessors: Array<Edge>,
    selectedSpecialization: string
): void {
    const credits = ('credits' in orderSubject ? orderSubject.credits : 0) ?? 0;

    details[`${choiceCode}-${semester}`] = {
        ...emptyNode,
        name: choices[choiceCode].refnCZ,
        successors: successors,
        predecessors: predecessors,
        credits: credits,
        type: 'choice'
    };

    spec[selectedSpecialization]['plan'][semester] = spec[selectedSpecialization]['plan'][
        semester
    ].filter((subject) => !('choice' in subject) || subject.choice != choiceCode);

    spec[selectedSpecialization]['plan'][semester].push({
        choice: `${choiceCode}-${semester}`,
        credits: credits
    });
}

/**
 * Checks whether a subject code is part of any choice list in the given plan.
 *
 * @param code - Subject code to search for.
 * @param order - Semester plan map.
 * @param choices - Available choice definitions.
 * @returns True if the subject is found in any choice list.
 */
export function isInSomeChoice(
    code: string,
    order: Record<string, Array<OrderSubject>>,
    choices: Choices
): boolean {
    return Object.values(order).some((semester) => {
        return semester.some((subject) => {
            if (!('choice' in subject)) {
                return false;
            }
            const choiceCode = subject.choice.replace(/-\d+$/, '');
            return choices[choiceCode].list.some((item) => item === code);
        });
    });
}
