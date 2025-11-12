import subjectInfoData from '../../data/final_tree.json'

function ChoiceConnection({course, subjectWidth, isPredecessor}) {
    let subjectsList = isPredecessor ? course.predecessors : course.successors;
    let voluntarySubjectsArray = subjectsList.map(subject => subject.code).filter(code => !Object.keys(subjectInfoData["details"]).includes(code));
    let compulsorySubjectsArray = subjectsList.map(subject => subject.code).filter(code => Object.keys(subjectInfoData["details"]).includes(code));
    let volunatrySubjectstext = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré nejsou povinné: ${voluntarySubjectsArray.join(", ")}`;
    let compulsorySubjectsText = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré jsou povinné: ${compulsorySubjectsArray.join(", ")}`;

    let yStart = isPredecessor ? 25 : 5;
    let yEnd = isPredecessor ? 55 : 30;
    let x = subjectWidth / 4;

    let compulsoryColor = compulsorySubjectsArray.length == 0 ? "transparent" : "black";
    let voluntaryColor = voluntarySubjectsArray.length == 0 ? "transparent" : "gray";

    return (
        <div style={{display: "flex", flexDirection: "row"}}>
            <svg width={subjectWidth / 2} height="60">
                <g className='choiceConnection' style={{
                        cursor: compulsoryColor === "transparent" ? "default" : "help",
                        pointerEvents: compulsoryColor === "transparent" ? "none" : "auto"
                }}>
                    {compulsoryColor != "transparent" &&
                        <title>{compulsorySubjectsText}</title>
                    }
                    <line 
                        key="vertline" 
                        x1={x} y1={yStart} 
                        x2={x} y2={yEnd} 
                        stroke={compulsoryColor} 
                        strokeWidth="2"
                    />
                    <polygon points={`${x - 5},${yEnd} ${x + 5},${yEnd} ${x},${yEnd + 5}`} fill={compulsoryColor} />
                    <circle cx={x} cy={isPredecessor ? 15 : 45} r="10" fill="transparent" stroke={compulsoryColor} strokeWidth="2" />
                    <text 
                        x={x} 
                        y={isPredecessor ? "20" : "50"} 
                        textAnchor="middle" 
                        fontSize="12"
                        fontFamily='Inter'
                        fill={compulsoryColor}
                        style={{fontWeight: 600 }}
                    >
                        ?
                    </text>
                </g>
            </svg>
            <svg width={subjectWidth / 2} height="60">
                <g className='choiceConnection' style={{
                        cursor: voluntaryColor === "transparent" ? "default" : "help",
                        pointerEvents: voluntaryColor === "transparent" ? "none" : "auto"
                }}>
                    {voluntaryColor != "transparent" &&
                        <title>{volunatrySubjectstext}</title>
                    }
                    <line 
                        key="vertline" 
                        x1={x} y1={yStart} 
                        x2={x} y2={yEnd} 
                        stroke={voluntaryColor} 
                        strokeWidth="2"
                    />
                    <polygon points={`${x - 5},${yEnd} ${x + 5},${yEnd} ${x},${yEnd + 5}`} fill={voluntaryColor} />
                    <circle cx={x} cy={isPredecessor ? 5 : 45} r="10" fill="transparent" stroke={voluntaryColor} strokeWidth="2" />
                    <text 
                        x={x} 
                        y={isPredecessor ? "10" : "50"} 
                        textAnchor="middle" 
                        fontSize="12"
                        fontFamily='Inter'
                        fill={voluntaryColor}
                        style={{fontWeight: 600 }}
                    >
                        ?
                    </text>
                </g>
            </svg>
        </div>
    )
}

export default ChoiceConnection