import { Layout } from "@/consts/VisualisationParameters";
import { EdgeOffsets, RealPositions } from "@/types/subjects";

export function getPath(positions: RealPositions, startCode: string, endCode: string, xOffsets: EdgeOffsets, yOffsets: EdgeOffsets) : string | null {
    const start = positions[startCode];
    const end = positions[endCode];
    if (!start || !end) { return null; }
    const startX = start.x + Layout.subjectWidth / 2 + Layout.subjectPadding;
    const startY = start.y + Layout.subjectHeight / 2 + Layout.subjectPadding;
    const endX = end.x + Layout.subjectWidth / 2 + Layout.subjectPadding;
    const endY = end.y + Layout.subjectHeight / 2 + Layout.subjectPadding;
    const midX = (startX + endX) / 2;
    if (startX > endX) { return null; }
    
    let yStartOffset = yOffsets[`${startCode}-${endCode}-start`];
    let yEndOffset = yOffsets[`${startCode}-${endCode}-end`];
    let xOffset = xOffsets[`${startCode}-${endCode}`];

    const yDiff = (endY + yEndOffset) - (startY + yStartOffset);
    const xDiff = endX - startX;

    if (Math.abs(yDiff) < Layout.subjectHeight) {
        const curvature = 0.9;
        const cp1x = startX + (endX - startX) * curvature;
        const cp2x = endX - (startX - endX) * -curvature;

        return `
            M ${startX} ${startY + yStartOffset}
            C ${cp1x} ${startY + yStartOffset}, 
            ${cp2x} ${endY + yEndOffset}, 
            ${endX} ${endY + yEndOffset}
        `;
    }

    const r = 20;
    const actualR = Math.min(r, Math.abs(yDiff / 2), Math.abs(xDiff / 2));
    const dirY = Math.sign(yDiff);

    let path = `
        M ${startX} ${startY + yStartOffset}
        L ${midX + xOffset - actualR} ${startY + yStartOffset}
        Q ${midX + xOffset} ${startY + yStartOffset}, ${midX + xOffset} ${startY + yStartOffset + (actualR * dirY)}
        L ${midX + xOffset} ${endY + yEndOffset - (actualR * dirY)}
        Q ${midX + xOffset} ${endY + yEndOffset}, ${midX + xOffset + actualR} ${endY + yEndOffset}
        L ${endX} ${endY + yEndOffset}
    `;
    return path;
}