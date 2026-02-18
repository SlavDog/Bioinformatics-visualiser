import { ensureOffset } from '@utils/Graph/dataUtils.js';
import { EdgeOffsets, Details, Edge, OrderSubject } from '@/types/subjects';
import { Layout } from '@/consts/VisualisationParameters';

export function fillEdgeXOffsets(edgeXOffsets: EdgeOffsets, infoData: Details,
                                 orderData: Record<string, Array<OrderSubject>>) : void {
    const numberOfSuccsBySemester = getNumberOfSuccsBySemester(orderData, infoData);

    // assign x offsets
    Object.entries(orderData).forEach(([semester, subjects]) => {
        const centerOffset = (numberOfSuccsBySemester[Number(semester) - 1] - 1) / 2;
        let edgeIndex = 0;
        subjects.forEach(parent => {
            const parentCode = "code" in parent ? parent.code : parent.choice;
            if (!infoData[parentCode]) {return;}

            infoData[parentCode].successors.forEach(successor => {
                if (!infoData[successor.code]) {return;}
                ensureOffset(edgeXOffsets, `${parentCode}-${successor.code}`,
                             (edgeIndex - centerOffset) * Layout.edgeXOffsetStep);
                edgeIndex += 1;
           })
        });
    });
}


function getNumberOfSuccsBySemester(orderData: Record<string, Array<OrderSubject>>, infoData: Details) : Array<number> {
    const numberOfSuccsBySemester = Array(Object.keys(orderData).length).fill(0);
    Object.values(infoData).forEach(course => {
        course.successors.forEach((successor) => {
            if (!infoData[successor.code] || infoData[successor.code].semester == null) {return;}
            numberOfSuccsBySemester[Number(course.semester) - 1] += 1;
        });
    });
    return numberOfSuccsBySemester;
}


export function fillOrGroupOffsets(orGroupEndOffsets: Record<string, number>, edge: Edge, offset: number) : void {
    edge.groups.forEach((group) => {
        group.forEach((codeInGroup) => {
            orGroupEndOffsets[`${codeInGroup}-${edge.code}`] = offset;
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
