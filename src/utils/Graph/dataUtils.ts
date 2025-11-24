export const emptyNode = {
    name: "",
    faculty: "",
    successors: [],
    predecessors: [],
    language: "",
    completion: "",
    has_successors: true,
    has_parent: true,
    credits: 0,
    semester: null,
    link: "",
    type: ""
};


export function ensureOffset(allOffsets: Record<string, number>, key: string, offsetToAdd: number) : number {
    if (key in allOffsets) {
        if (allOffsets[key] !== offsetToAdd) {
            console.warn(`Overwriting key ${key}: ${allOffsets[key]} → ${offsetToAdd}`);
        }
    }
    if (!allOffsets[key]) {
        allOffsets[key] = offsetToAdd; 
    }
    return allOffsets[key];
}
