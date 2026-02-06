import { Choice, Choices, OrderSubject, Details, Edge, Order} from "@/types/subjects";
import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details: Details, order: Order, choices: Choices, selectedSpecialization: string) : Order {
    const newOrder = structuredClone(order);
    let successors: Array<Edge> = [];
    let predecessors: Array<Edge> = [];

    Object.entries(order[selectedSpecialization]).forEach(([semester, subjectList]) => {
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
            return details[code][predsOrSuccs];
        })
        .flat()
        .filter((edge => edge.code in details))

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
    return neighboursArray
}


function saveChoiceNode(details: Details, newOrder: Order, choiceCode: string, orderSubject: OrderSubject,
                        semester: number, choices: Choices, successors: Array<Edge>,
                        predecessors: Array<Edge>, selectedSpecialization: string) : void {
    if (!("credits" in orderSubject)) {return; }
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

    newOrder[selectedSpecialization][semester] = newOrder[selectedSpecialization][semester]
            .filter((subject) => !("choice" in subject) || subject.choice != choiceCode)

    newOrder[selectedSpecialization][semester].push(
        {
            "choice": `${choiceCode}-${semester}`,
            "credits": orderSubject.credits
        }
    )

}


export function isInSomeChoice(code: string, choices: Choices) : boolean {
    const result = Object.values(choices)
    .some(v => v.list
        .some(item => item == code || (typeof item == "object" 
            && "code" in item && item.code == code)));
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == code || (typeof item == "object" 
                                           && "code" in item
                                           && item.code == code)));
}