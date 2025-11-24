type ChoiceConnectionProps = {
    color: string,
    x: number,
    yStart: number,
    yEnd: number,
    isPredecessor: boolean,
    text: string,
    subjectWidth: number
}


function ChoiceConnection({color, x, yStart, yEnd, isPredecessor, text, subjectWidth} : ChoiceConnectionProps) {
    return (
        <svg width={subjectWidth / 2} height="60">
            <g className='choiceConnection' style={{
                cursor: color === "transparent" ? "default" : "help",
                pointerEvents: color === "transparent" ? "none" : "auto"
            }}>
                {color != "transparent" &&
                    <title>{text}</title>}
                <line 
                    key="vertline" 
                    x1={x} y1={yStart} 
                    x2={x} y2={yEnd} 
                    stroke={color} 
                    strokeWidth="2"
                />
                <polygon points={`${x - 5},${yEnd} ${x + 5},${yEnd} ${x},${yEnd + 5}`} fill={color} />
                <circle cx={x} cy={isPredecessor ? 15 : 45} r="10" fill="transparent" stroke={color} strokeWidth="2" />
                <text 
                    x={x} 
                    y={isPredecessor ? "20" : "50"} 
                    textAnchor="middle" 
                    fontSize="12"
                    fontFamily='Inter'
                    fill={color}
                    style={{fontWeight: 600 }}
                >
                    i
                </text>
            </g>
        </svg>
    );
}

export default ChoiceConnection;