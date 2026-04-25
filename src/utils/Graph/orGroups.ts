import { Course } from '@/types';

export function getUniquePredGroups(course: Course): Array<Array<string>> {
    let seen = new Set();
    let result: Array<Array<string>> = [];
    course.predecessors.forEach((pred) => {
        pred.groups.forEach((group) => {
            let groupKey = group.slice().sort().join(',');
            if (!seen.has(groupKey)) {
                seen.add(groupKey);
                result.push(group);
            }
        });
    });
    return result;
}

export function deleteCodeFromOrGroups(
    groups: Array<Array<string>>,
    codeToDelete: string
): Array<Array<string>> {
    return groups.map((group) => group.filter((element) => element != codeToDelete));
}
