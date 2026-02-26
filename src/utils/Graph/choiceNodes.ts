import { Choice, Choices, OrderSubject, Details, Edge, Spec} from "@/types/subjects";
import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details: Details, spec: Spec, choices: Choices, selectedSpecialization: string) : Spec {
    const newOrder = structuredClone(spec);
    const plan = spec[selectedSpecialization].plan;

    Object.entries(plan).forEach(([semester, subjectList]) => {
        subjectList
            .filter((subject) => "choice" in subject)
            .forEach((choiceSubject) => {
                    let successors: Array<Edge> = [];
                    let predecessors: Array<Edge> = [];
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
    const key = connectSuccs ? "successors" : "predecessors";
    const inverseKey = connectSuccs ? "predecessors" : "successors";
    const choiceNodeCode = `${choiceCode}-${semester}`;

    const choiceListCodes = new Set(subjChoices.list.map(item => typeof item === "string" ? item : item.code));

    const allNeighbours = subjChoices.list
        .flatMap(item => {
            const code = typeof item === "string" ? item : item.code;
            return details[code][key] || [];
        })
        .filter((edge => edge.code in details))
        // filter out duplicates
    
    const neighboursArray = allNeighbours
        .filter((value, index, self) => index === self.findIndex((t) => t.code === value.code));

    neighboursArray.forEach(neighbour => {
        const shouldDrawFullLine = details[neighbour.code][inverseKey]
            .filter(subject => choiceListCodes.has(subject.code))
            .some(subject => subject.by_prerequisites);

        // Remove direct links to same choice subjects
        details[neighbour.code][inverseKey] = details[neighbour.code][inverseKey]
            .filter(subject => !choiceListCodes.has(subject.code));

        // Add a new link to choice node
        if (!details[neighbour.code][inverseKey].some(succ => succ.code == choiceNodeCode)) {
            details[neighbour.code][inverseKey].push({
                "code": choiceNodeCode,
                "groups" : neighbour.groups,
                "by_prerequisites": shouldDrawFullLine
            });
        }
    });

    // replace choice node subjects from successors groups by choice code
    if (connectSuccs) {
        replaceChoiceSubjectsFromSuccGroups(neighboursArray, choiceNodeCode, choiceListCodes, details, inverseKey);
    } 
    return neighboursArray
}


function replaceChoiceSubjectsFromSuccGroups(neighboursArray: Edge[], choiceNodeCode: string,
                                             choiceListCodes: Set<string>, details: Details,
                                             inverseKey: "successors" | "predecessors") {    
    neighboursArray.forEach(neighbourEdge => {
            neighbourEdge.groups = processGroups(neighbourEdge.groups, choiceListCodes, choiceNodeCode);

            const neighbourNode = details[neighbourEdge.code];
            if (!neighbourNode) { return; }

            neighbourNode[inverseKey] = neighbourNode[inverseKey].map(edge => {
                if (edge.code === choiceNodeCode) {
                    return {
                        ...edge,
                        groups: processGroups(edge.groups, choiceListCodes, choiceNodeCode)
                    }
                }                
                return edge;
            });
        });
}


function processGroups(groups: string[][], choiceListCodes: Set<string>, choiceNodeCode: string) {
    return groups.map(group => {
        const containsSubject = group.some(subject => choiceListCodes.has(subject));
        if (containsSubject) {
            const cleanedGroup = group.filter(subject => !choiceListCodes.has(subject));
            return [...cleanedGroup, choiceNodeCode];
        }
        return group;
    });
}


function saveChoiceNode(details: Details, newSpec: Spec, choiceCode: string, orderSubject: OrderSubject,
                        semester: number, choices: Choices, successors: Array<Edge>,
                        predecessors: Array<Edge>, selectedSpecialization: string) : void {
    const credits = ("credits" in orderSubject ? orderSubject.credits : 0) ?? 0;

    details[`${choiceCode}-${semester}`] = {
        ...emptyNode,
        name: choices[choiceCode].refnCZ,
        successors: successors, 
        predecessors: predecessors,
        credits: credits,
        semester: semester,
        type: "choice"
    };

    newSpec[selectedSpecialization]["plan"][semester] = newSpec[selectedSpecialization]["plan"][semester]
            .filter((subject) => !("choice" in subject) || subject.choice != choiceCode)

    newSpec[selectedSpecialization]["plan"][semester].push(
        {
            "choice": `${choiceCode}-${semester}`,
            "credits": credits
        }
    )
}


export function isInSomeChoice(code: string, order: Record<string, Array<OrderSubject>>, choices: Choices) : boolean {
    return Object.values(order).some(semester => {
        return semester.some(subject => {
            if ("choice" in subject) {
                const choiceCode = subject.choice.replace(/-\d+$/, "");
                return choices[choiceCode].list.some(item => item == code);
            }
            return false;
        })
    });
}