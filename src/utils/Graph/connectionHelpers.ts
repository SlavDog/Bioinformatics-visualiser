import { Layout } from '@/consts/VisualisationParameters';
import { EdgeOffsets, CodeToPosition } from '@/types';

const CENTER_X = Layout.subjectWidth / 2 + Layout.subjectPadding;
const CENTER_Y = Layout.subjectHeight / 2 + Layout.subjectPadding;

export function getPath(
    positions: CodeToPosition,
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

    const edgeKey = `${startCode}-${endCode}`;
    const startX = start.x + CENTER_X;
    const startY = start.y + CENTER_Y + (yOffsets[`${edgeKey}-start`] ?? 0);
    const endX = end.x + CENTER_X;
    const endY = end.y + CENTER_Y + (yOffsets[`${edgeKey}-end`] ?? 0);

    if (startX > endX) {
        return null;
    }

    const midX = (startX + endX) / 2 + (xOffsets[edgeKey] ?? 0);
    const yDiff = endY - startY;
    const xDiff = endX - startX;
    const dirY = Math.sign(yDiff);
    const r = Math.min(Layout.edgeCurveMinRadius, Math.abs(yDiff / 2), Math.abs(xDiff / 2));

    return `
        M ${startX} ${startY}
        L ${midX - r} ${startY}
        Q ${midX} ${startY} ${midX} ${startY + r * dirY}
        L ${midX} ${endY - r * dirY}
        Q ${midX} ${endY} ${midX + r} ${endY}
        L ${endX} ${endY}
    `;
}
