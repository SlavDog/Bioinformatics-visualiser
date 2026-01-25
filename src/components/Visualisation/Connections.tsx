import { Layout } from "@/consts/VisualisationParameters";
import { Details, EdgeOffsets, RealPositions } from "@/types/subjects";


type ConnectionsProps = {
  processedSubjects: Details,
  positions: RealPositions,
  xOffsets: EdgeOffsets,
  yOffsets: EdgeOffsets
}


function Connections({processedSubjects, positions, xOffsets, yOffsets} : ConnectionsProps) {
  return (
    <svg className='connections'>
        {Object.entries(processedSubjects).map(([startCode, course]) => {
            return course.successors.map((endInfo, i) => {
              const start = positions[startCode];
              const endCode = endInfo.code;
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

                const r = 20;
                const yDiff = (endY + yEndOffset) - (startY + yStartOffset);
                const xDiff = endX - startX;
                const actualR = Math.min(r, Math.abs(yDiff / 2), Math.abs(xDiff / 2));
                const dirY = Math.sign(yDiff);

                const path = `
                    M ${startX} ${startY + yStartOffset}
                    L ${midX + xOffset - actualR} ${startY + yStartOffset}
                    Q ${midX + xOffset} ${startY + yStartOffset}, ${midX + xOffset} ${startY + yStartOffset + (actualR * dirY)}
                    L ${midX + xOffset} ${endY + yEndOffset - (actualR * dirY)}
                    Q ${midX + xOffset} ${endY + yEndOffset}, ${midX + xOffset + actualR} ${endY + yEndOffset}
                    L ${endX} ${endY + yEndOffset}
                `;
                let nonPrerequisite = !endInfo.by_prerequisites;
                return (<path key={`${startCode}-${endCode}-${i}`} d={path}
                    stroke={nonPrerequisite ? "gray" : "black"} fill="transparent" strokeWidth="2" strokeDasharray={nonPrerequisite ? "2 3" : "none"}/>);
            })}
        )}
    </svg>
  );
}

export default Connections