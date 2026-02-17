import { Choice, Choices, OrderSubject, Details, Edge, Spec} from "@/types/subjects";
import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details: Details, spec: Spec, choices: Choices, selectedSpecialization: string) : Spec {
    const newOrder = structuredClone(spec);
    let successors: Array<Edge> = [];
    let predecessors: Array<Edge> = [];

    Object.entries(spec[selectedSpecialization].plan).forEach(([semester, subjectList]) => {
        subjectList
            .filter((subject) => "choice" in subject)
            .forEach((choiceSubject) => {
                const choiceCode = choiceSubject.choice;

                if (!choiceCode.includes("core") && !choiceCode.includes("tv")) { 
                    successors = connectPredsOrSuccs(true, choices[choiceCode], details, choiceCode, Number(semester));
                    predecessors = connectPredsOrSuccs(false, choices[choiceCode], details, choiceCode, Number(semester));
                };
                saveChoiceNode(details, newOrder, choiceCode, choiceSubject,
                               Number(semester), choices, successors, predecessors,
                               selectedSpecialization);
        });
    });
    return newOrder;
}


function connectPredsOrSuccs(connectSuccs: boolean, subjChoices: Choice, details: Details,
                             choiceCode: string, semester: number) : Edge[] {
    let neighboursArray: Array<Edge> = [];
    const predsOrSuccs = connectSuccs ? "successors" : "predecessors";
    const inversePredsOrSuccs = connectSuccs ? "predecessors" : "successors";

    neighboursArray = subjChoices.list
        .map(item => {
            const code = typeof item === "string" ? item : item.code;
            console.log(code);
            return details[code][predsOrSuccs];
        })
        .flat()
        .filter((edge => edge.code in details))
        // filter out duplicates
        .filter((value, index, self) =>
            index === self.findIndex((t) => t.code === value.code)
        );

    neighboursArray.forEach(neighbour => {
        const shouldDrawFullLine = details[neighbour.code][inversePredsOrSuccs]
            .filter(subject => subjChoices.list.includes(subject.code))
            .some(subject => subject.by_prerequisites);

        // Remove direct links to choice subjects
        details[neighbour.code][inversePredsOrSuccs] = details[neighbour.code][inversePredsOrSuccs]
            .filter(subject => !subjChoices.list.includes(subject.code));

        // Add a new link to choice node
        if (!details[neighbour.code][inversePredsOrSuccs].some(succ => succ.code == `${choiceCode}-${semester}`)) {
            details[neighbour.code][inversePredsOrSuccs].push({
                "code": `${choiceCode}-${semester}`,
                "groups" : neighbour.groups,
                "by_prerequisites": shouldDrawFullLine
            });
        }
    });

    // remove choice node subjects from successors groups
    if (connectSuccs) {
        neighboursArray.forEach(neighbourEdge => {
            neighbourEdge.groups = neighbourEdge.groups.map(group => {
                if (group.some(subject => subjChoices.list.includes(subject))) {
                    group.push(`${choiceCode}-${semester}`);
                    return group.filter(subject => !subjChoices.list.includes(subject))
                }
                return group;
            });
            details[neighbourEdge.code][inversePredsOrSuccs] = details[neighbourEdge.code][inversePredsOrSuccs].map(edge => {
                if (edge.code === `${choiceCode}-${semester}`) {
                    return {
                        ...edge,
                        groups: edge.groups.map(group => {
                            if (group.some(subject => subjChoices.list.includes(subject))) {
                                group.push(`${choiceCode}-${semester}`);
                                return group.filter(subject => !subjChoices.list.includes(subject))
                            }
                            return group;
                        })
                    }
                }                
                return edge;
            });
        });
    } 
    return neighboursArray
}


function saveChoiceNode(details: Details, newSpec: Spec, choiceCode: string, orderSubject: OrderSubject,
                        semester: number, choices: Choices, successors: Array<Edge>,
                        predecessors: Array<Edge>, selectedSpecialization: string) : void {
    details[`${choiceCode}-${semester}`] = {
        ...emptyNode,
        name: choices[choiceCode].refnCZ,
        successors: successors, 
        predecessors: predecessors,
        credits: orderSubject.credits ?? 0,
        subjects: [],
        semester: semester,
        type: "choice"
    };

    newSpec[selectedSpecialization]["plan"][semester] = newSpec[selectedSpecialization]["plan"][semester]
            .filter((subject) => !("choice" in subject) || subject.choice != choiceCode)

    newSpec[selectedSpecialization]["plan"][semester].push(
        {
            "choice": `${choiceCode}-${semester}`,
            "credits": orderSubject.credits ?? 0
        }
    )

}


export function isInSomeChoice(code: string, order: Record<string, Array<OrderSubject>>, choices: Choices) : boolean {
    return Object.values(order).some(semester => {
        return semester.some(subject => {
            if ("choice" in subject) {
                const choiceCode = subject.choice.replace(/-\d+$/, "");  // Remove semester suffix
                return choices[choiceCode].list.some(item => item == code);
            }
            return false;
        })
    });
}