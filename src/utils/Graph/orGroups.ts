import { Course } from '@/types';

/**
 * Returns unique predecessor groups for a given course.
 * Predecessor groups define OR-relationships between prerequisites —
 * a group is satisfied if at least one course in it is completed.
 *
 * @param course - The course whose predecessor groups to extract.
 * @returns Array of unique predecessor groups.
 */
export function getUniquePredGroups(course: Course): string[][] {
    let seen = new Set();
    let result: string[][] = [];
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

/**
 * Removes a specific course code from all OR-groups.
 *
 * @param groups - The OR-groups to filter.
 * @param codeToDelete - The course code to remove from all groups.
 * @returns New array of groups with the specified code removed.
 */
export function deleteCodeFromOrGroups(groups: string[][], codeToDelete: string): string[][] {
    return groups
        .map((group) => group.filter((element) => element != codeToDelete))
        .filter((group) => group.length > 0);
}
