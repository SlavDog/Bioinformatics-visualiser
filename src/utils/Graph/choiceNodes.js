import { emptyNode } from "@utils/Graph/dataUtils";

export function addChoiceNodes(details, order, choices) {
    Object.entries(order).forEach(([semester, subjectList]) => {
        subjectList
                .filter((subject) => subject["choice"] != undefined)
                .forEach((choiceSubject) => {
            const choiceCode = choiceSubject["choice"];
            if (choiceCode == "core" || choiceCode == "tv") { 
                details[choiceCode] = {
                ...emptyNode,
                name: choices[choiceCode].refnCZ,
                successors: [], 
                predecessors: [],
                credits: choiceSubject.credits,
                subjects: [],
                semester: Number(semester),
                type: "choice"
            };
                return; 
            }

            let successors = [];
            let predecessors = [];

            choices[choiceCode].list.forEach(code => {
                details[code].successors.forEach(successor => {
                    if (!choices[choiceCode].list.includes(successor.code)) {
                        successors.push({ ...successor });
                    }
                }) 
            })

            choices[choiceCode].list.forEach(code => {
                details[code].predecessors.forEach(predecessor => {
                    if (!choices[choiceCode].list.includes(predecessor.code)) {
                        predecessors.push({ ...predecessor });
                    }
                }) 
            })
            
            predecessors.forEach(predecessor => {
                details[predecessor.code].successors = details[predecessor.code].successors
                                                .filter(subject => !isInSomeChoice(subject.code, choices));
                details[predecessor.code].successors.push({"code": choiceCode, "groups" : predecessor.groups, "by_prerequisites": true});
            });
            
            details[choiceCode] = {
                ...emptyNode,
                name: choices[choiceCode].refnCZ,
                successors: successors, 
                predecessors: predecessors,
                credits: choiceSubject.credits,
                subjects: choiceSubject.subjects,
                semester: Number(semester),
                type: "choice"
            };
        });
    })
}


export function isInSomeChoice(subject, choices) {
    return Object.values(choices)
        .some(v => v.list
            .some(item => item == subject || item.code == subject));
}