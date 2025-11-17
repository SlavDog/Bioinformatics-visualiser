import { ensureOffset } from '@utils/Graph/dataUtils.js';

export function fillEdgeXOffsets(edgeXOffsets, infoData, orderData) {
    // count number of successors per semester
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code]) {return;}
            if (infoData[successor.code].semester != "null") {
                numberOfSuccsBySemester[course.semester - 1] += 1;
            }
        });
    });

    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        let i = 0;
        subjects.forEach(parent => {
            const parentCode = parent.code ?? parent.choice;
            if (!infoData[parentCode]) {return;}

            infoData[parentCode].successors.forEach(successor => {
                if (!infoData[successor.code]) {return;}
                ensureOffset(edgeXOffsets, `${parentCode}-${successor.code}`,
                    (i - (numberOfSuccsBySemester[semester] - 1) / 2) * 12);
                i += 1;
           })
        });
    });
}


export function fillOrGroupOffsets(orGroupEndOffsets, successorInfo, offset) {
    successorInfo.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[codeInGroup] = offset;
        })
    })
}


export function getYOffsetForOrGroup(edgeYOffsets, group, succCode) {
    let i = 0;
    while (i < group.length) {
        if (`${group[i]}-${succCode}-end` in edgeYOffsets) {
            return edgeYOffsets[`${group[i]}-${succCode}-end`];
        }
        i++;
    }
    console.warn("No offset found for OR group", group, "to", succCode);
}

