const Connections = ({subjectInfoData, positions, xOffsets, yOffsets,
                      subjectHeight, subjectWidth}) => {
  return (
    <svg className='connections'>
        {Object.entries(subjectInfoData).map(([startCode, course]) => {
            return course.successors.map((endCode, i) => {

                const start = positions[startCode];
                const end = positions[endCode];
                if (!start || !end) { return null; }
                const startX = start.x + subjectWidth / 2;
                const startY = start.y + subjectHeight / 2;
                const endX = end.x + subjectWidth / 2;
                const endY = end.y + subjectHeight / 2;
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
                return (<path key={`${startCode}-${endCode}-${i}`} d={path}
                    stroke="black" fill="transparent" strokeWidth="2" />);
            })}
        )}
    </svg>
  );
}

export default Connections