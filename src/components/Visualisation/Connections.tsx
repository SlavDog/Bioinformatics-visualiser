import { Details, EdgeOffsets, RealPositions } from "@/types/subjects";
import { getPath } from "@utils/Graph/connectionHelpers";


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

                const path = getPath(positions, startCode, endInfo.code, xOffsets, yOffsets);
                if (path === null) { return null; }
                let nonPrerequisite = !endInfo.by_prerequisites;

                return (<path key={`${startCode}-${endInfo.code}-${i}`} d={path}
                    stroke={nonPrerequisite ? "gray" : "black"} fill="transparent" strokeWidth="2" strokeDasharray={nonPrerequisite ? "2 3" : "none"}/>);
            })}
        )}
    </svg>
  );
}

export default Connections