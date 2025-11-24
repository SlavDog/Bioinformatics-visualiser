import { Choice, Choices, OrderSubject, Details, Edge, Order} from "@/types/subjects";
import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details: Details, order: Order, choices: Choices) : Order {
    const newOrder = structuredClone(order);
    let successors: Array<Edge> = [];
    let predecessors: Array<Edge> = [];
    Object.entries(order).forEach(([semester, subjectList]) => {
        subjectList
            .filter((subject) => "choice" in subject)
            .forEach((choiceSubject) => {
                const choiceCode = choiceSubject.choice;

                if (choiceCode != "core" && choiceCode != "tv") { 
                    successors = getPredsOrSuccs(true, choices[choiceCode], details);
                    predecessors = getPredsOrSuccs(false, choices[choiceCode], details);

                    predecessors.forEach(predecessor => {
                        details[predecessor.code].successors = details[predecessor.code].successors
                            .filter(subject => !isInSomeChoice(subject.code, choices));
                        details[predecessor.code].successors.push({
                            "code": choiceCode,
                            "groups" : predecessor.groups,
                            "by_prerequisites": true
                        });
                    });
                };
                saveChoiceNode(details, newOrder, choiceCode, choiceSubject,
                               Number(semester), choices, successors, predecessors);
        });
    });
    return newOrder;
}


function getPredsOrSuccs(getSuccs: boolean, subjChoices: Choice, details: Details) : Array<Edge> {
    const result: Array<Edge> = [];
    subjChoices.list
        .filter(choiceSubject => typeof choiceSubject != "string")
        .forEach(subject => {
            details[subject.code][getSuccs ? "successors" : "predecessors"].forEach(successor => {
                if (!subjChoices.list.includes(successor.code)) {
                    result.push({ ...successor });
                }
            }) 
        })
    return result;
}


function saveChoiceNode(details: Details, newOrder: Order, choiceCode: string, orderSubject: OrderSubject,
                        semester: number, choices: Choices, successors: Array<Edge>,
                        predecessors: Array<Edge>) : void {
    if (!("credits" in orderSubject)) {return; }
    details[`${choiceCode}-${semester}`] = {
        ...emptyNode,
        name: choices[choiceCode].refnCZ,
        successors: successors, 
        predecessors: predecessors,
        credits: orderSubject.credits,
        subjects: [],
        semester: semester,
        type: "choice"
    };

    newOrder[semester] = newOrder[semester]
            .filter((subject) => "choice" in subject && subject.choice != choiceCode)

    newOrder[semester].push(
        {
            "choice": `${choiceCode}-${semester}`,
            "credits": orderSubject.credits
        }
    )
}


export function isInSomeChoice(code: string, choices: Choices) : boolean {
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == code || (typeof item == "object" 
                                           && "code" in item
                                           && item.code == code)));
}