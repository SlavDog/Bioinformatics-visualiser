export function getUniquePredGroups(course) {
    let seen = new Set();
    let result = [];
    course.predecessors.forEach(pred => {
        pred.groups.forEach(group => {
            let groupKey = group.slice().sort().join(',');
            if (!seen.has(groupKey)) {
                seen.add(groupKey);
                result.push(group);
            }
        });
    });
    console.log(result);
    return result;
}


export function deleteCodeFromOrGroups(groups, codeToDelete) {
    return groups.map((group) =>
        group.filter(element => element != codeToDelete)
    );
}