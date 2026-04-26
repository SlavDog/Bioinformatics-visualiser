import { Layout } from '@/consts/visualisationParameters';
import Tippy from '@tippyjs/react';

type ChoiceConnectionProps = {
    color: string,
    x: number,
    yStart: number,
    yEnd: number,
    isPredecessor: boolean,
    allSoft: boolean,
    text: string,
    horizontal: boolean
}


function ChoiceConnection({horizontal, color, x, yStart, yEnd, isPredecessor, allSoft, text} : ChoiceConnectionProps) {
    if (horizontal) {
        const w = 60;
        const cx = isPredecessor ? 15 : 40;
        const lineStart = isPredecessor ? 25 : 5;
        const lineEnd = isPredecessor ? 55 : 30;
        const arrowX = lineEnd;
        const subjectHeight = Layout.detailMenuSubjectHeight;
        const centerY = (subjectHeight / 2) / 2;
        return (
            <Tippy content={text} disabled={color === "transparent" || !text}>
                <svg width={w} height={subjectHeight / 2}>
                    <g className='choiceConnection' style={{
                        cursor: color === "transparent" ? "default" : "help",
                        pointerEvents: color === "transparent" ? "none" : "auto"
                    }}>
                        <line x1={lineStart} y1={centerY} x2={lineEnd} y2={centerY} stroke={color} strokeWidth="2" strokeDasharray={allSoft ? "2 3" : "none"} />
                        <polygon points={`${arrowX - 5},${centerY - 5} ${arrowX - 5},${centerY + 5} ${arrowX},${centerY}`} fill={color} />
                        <circle cx={cx} cy={centerY} r="10" fill="transparent" stroke={color} strokeWidth="2" />
                        <text x={cx} y={centerY + 4} textAnchor="middle" fontSize="12" fontFamily='Inter' fill={color} style={{fontWeight: 600}}>i</text>
                    </g>
                </svg>
            </Tippy>
        );
    }
    const subjectWidth = Layout.detailMenuSubjectWidth;
    return (
        <Tippy content={text} disabled={color === "transparent" || !text}>
            <svg width={subjectWidth / 2} height="60">
                <g className='choiceConnection' style={{
                    cursor: color === "transparent" ? "default" : "help",
                    pointerEvents: color === "transparent" ? "none" : "auto"
                }}>
                    <line 
                        key="vertline" 
                        x1={x} y1={yStart} 
                        x2={x} y2={yEnd} 
                        stroke={color} 
                        strokeWidth="2"
                        strokeDasharray={allSoft ? "2 3" : "none"}
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
        </Tippy>
    );
}

export default ChoiceConnection;