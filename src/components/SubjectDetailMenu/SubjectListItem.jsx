import Subject from "../Subject"

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

function SubjectListItem({code, course}) {
    let predLineColor = course.predecessors.length != 0 ? "black" : "transparent";
    let succLineColor = course.successors.length != 0 ? "black" : "transparent";

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <svg width={subjectWidth} height="60">
                <line 
                    key="vertline" 
                    x1={subjectWidth / 2} y1="20" 
                    x2={subjectWidth / 2} y2="60" 
                    stroke={predLineColor} 
                    strokeDasharray="2 2 5 2" 
                    strokeWidth="2" />
                <text 
                    x={subjectWidth / 2} 
                    y="10" 
                    textAnchor="middle" 
                    fontSize="12"
                    fontFamily='Inter'
                    fill={predLineColor}
                >
                    ⬇️ Předcházející: {course.predecessors.map(subject => subject.code).join(', ')}
                </text>
            </svg>
                <Subject
                key={code}
                code={code}
                course={course}
                style={{
                    width: subjectWidth,
                    height: subjectHeight,
                    padding: subjectPadding,
                    transform: "scale(0.9)"
                }}
            />
            <svg width={subjectWidth} height="60">
                <line 
                    key="vertline" 
                    x1={subjectWidth / 2} y1="0"
                    x2={subjectWidth / 2} y2="35" 
                    stroke={succLineColor}
                    strokeDasharray="2 2 5 2"
                    strokeWidth="2" />
                <text 
                    x={subjectWidth / 2} 
                    y="50" 
                    textAnchor="middle" 
                    fontSize="12"
                    fontFamily='Inter'
                    fill={succLineColor}
                >
                    ⬇️ Navazující: {course.successors.map(subject => subject.code).join(', ')}
                </text>
            </svg>
        </div>
    )

}

export default SubjectListItem