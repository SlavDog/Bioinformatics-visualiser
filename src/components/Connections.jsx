const Connections = ({subjectInfoData, positions, xOffsets, yOffsets,
                      subjectHeight, subjectWidth, subjectPadding}) => {
  return (
    <svg className='connections'>
        {Object.entries(subjectInfoData).map(([startCode, course]) => {
            return course.successors.map((endInfo, i) => {
                const start = positions[startCode];
                const endCode = endInfo.code;
                const end = positions[endCode];
                if (!start || !end) { return null; }
                const startX = start.x + subjectWidth / 2 + subjectPadding;
                const startY = start.y + subjectHeight / 2 + subjectPadding;
                const endX = end.x + subjectWidth / 2 + subjectPadding;
                const endY = end.y + subjectHeight / 2 + subjectPadding;
                const midX = (startX + endX) / 2;
                if (startX > endX) { return null; }
                
                let yOffset = yOffsets[`${startCode}-${endCode}`];
                let xOffset = xOffsets[`${startCode}-${endCode}`];

                const path = `
                    M ${startX} ${startY + yOffset}
                    L ${midX + xOffset} ${startY + yOffset}
                    L ${midX + xOffset} ${endY + yOffset}
                    L ${endX} ${endY + yOffset}
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