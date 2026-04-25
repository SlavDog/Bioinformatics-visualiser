import { Layout } from '@/consts/VisualisationParameters';
import { EdgeOffsets, RealPositions } from '@/types';

export function getPath(
    positions: RealPositions,
    startCode: string,
    endCode: string,
    xOffsets: EdgeOffsets,
    yOffsets: EdgeOffsets
): string | null {
    const start = positions[startCode];
    const end = positions[endCode];
    if (!start || !end) {
        return null;
    }

    const centerX = Layout.subjectWidth / 2 + Layout.subjectPadding;
    const centerY = Layout.subjectHeight / 2 + Layout.subjectPadding;

    const startX = start.x + centerX;
    const startY = start.y + centerY + (yOffsets[`${startCode}-${endCode}-start`] || 0);
    const endX = end.x + centerX;
    const endY = end.y + centerY + (yOffsets[`${startCode}-${endCode}-end`] || 0);
    if (startX > endX) {
        return null;
    }

    const midX = (startX + endX) / 2;
    let xOffset = xOffsets[`${startCode}-${endCode}`] || 0;

    const yDiff = endY - startY;
    const xDiff = endX - startX;

    const r = 20;
    const actualR = Math.min(r, Math.abs(yDiff / 2), Math.abs(xDiff / 2));
    const dirY = Math.sign(yDiff);

    let path = `
        M ${startX} ${startY}
        L ${midX + xOffset - actualR} ${startY}
        Q ${midX + xOffset} ${startY}, ${midX + xOffset} ${startY + actualR * dirY}
        L ${midX + xOffset} ${endY - actualR * dirY}
        Q ${midX + xOffset} ${endY}, ${midX + xOffset + actualR} ${endY}
        L ${endX} ${endY}
    `;
    return path;
}
