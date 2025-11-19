import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details, order, choices) {
    const newOrder = structuredClone(order);
    let successors = [];
    let predecessors = [];
    Object.entries(order).forEach(([semester, subjectList]) => {
        subjectList
            .filter((subject) => subject["choice"] != undefined)
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
                               semester, choices, successors, predecessors);
        });
    });
    return newOrder;
}


function getPredsOrSuccs(isSuccs, subjChoices, details) {
    const result = [];
    subjChoices.list.forEach(code => {
        details[code][isSuccs ? "successors" : "predecessors"].forEach(successor => {
            if (!subjChoices.list.includes(successor.code)) {
                result.push({ ...successor });
            }
        }) 
    })
    return result;
}


function saveChoiceNode(details, newOrder, choiceCode, choiceSubject,
                        semester, choices, successors, predecessors) {
    details[`${choiceCode}-${semester}`] = {
        ...emptyNode,
        name: choices[choiceCode].refnCZ,
        successors: successors, 
        predecessors: predecessors,
        credits: choiceSubject.credits,
        subjects: [],
        semester: Number(semester),
        type: "choice"
    };

    newOrder[semester] = newOrder[semester]
            .filter((subject) => subject["choice"] != choiceCode)

    newOrder[semester].push(
        {
            "choice": `${choiceCode}-${semester}`,
            "credits": choiceSubject.credits
        }
    )
}


export function isInSomeChoice(subject, choices) {
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == subject || item.code == subject));
}