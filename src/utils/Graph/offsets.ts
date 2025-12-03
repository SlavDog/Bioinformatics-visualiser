import { ensureOffset } from '@utils/Graph/dataUtils.js';
import { EdgeOffsets, Details, Order, Edge } from '@/types/subjects';
import { Layout } from '@/consts/VisualisationParameters';

export function fillEdgeXOffsets(edgeXOffsets: EdgeOffsets, infoData: Details, orderData: Order) : void {
    // count number of successors per semester
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code] || infoData[successor.code].semester == null) {return;}
            console.log(course, successor.code);
            numberOfSuccsBySemester[Number(course.semester) - 1] += 1;
        });
    });

    console.log("Number of succs by semester:", numberOfSuccsBySemester);
    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        let i = 0;
        subjects.forEach(parent => {
            const parentCode = "code" in parent ? parent.code : parent.choice;
            if (!infoData[parentCode]) {return;}

            infoData[parentCode].successors.forEach(successor => {
                if (!infoData[successor.code]) {return;}
                console.log(parentCode, successor.code, i, (i - (numberOfSuccsBySemester[Number(semester) - 1]) / 2) * Layout.edgeXOffsetStep);
                ensureOffset(edgeXOffsets, `${parentCode}-${successor.code}`,
                    (i - (numberOfSuccsBySemester[Number(semester) - 1] - 1) / 2) * Layout.edgeXOffsetStep);
                i += 1;
           })
        });
    });
}


export function fillOrGroupOffsets(orGroupEndOffsets: Record<string, number>, edge: Edge, offset: number) : void {
    edge.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[codeInGroup] = offset;
        })
    })
}


export function getYOffsetForOrGroup(edgeYOffsets: EdgeOffsets, group: Array<string>, succCode: string) : number | undefined {
    let i = 0;
    while (i < group.length) {
        if (`${group[i]}-${succCode}-end` in edgeYOffsets) {
            return edgeYOffsets[`${group[i]}-${succCode}-end`];
        }
        i++;
    }
    console.warn("No offset found for OR group", group, "to", succCode);
}

