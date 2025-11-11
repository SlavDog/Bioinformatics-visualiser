export const emptyNode = {
    name: "",
    faculty: "",
    successors: [],
    predecessors: [],
    language: "",
    completion: "",
    has_successors: true,
    has_parent: true,
    credits: "",
    link: ""
};


export function parseSemester(val) {
  return val === "null" ? null : Number(val);
}


export function ensureOffset(allOffsets, key, offsetToAdd) {
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
