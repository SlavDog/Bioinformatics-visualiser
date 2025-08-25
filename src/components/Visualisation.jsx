import subjectOrderData from '../data/order.json';
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';
import {addHelperNodesAndOffsets} from '../utils/helperFunctions'

const columnWidth = 400;
const rowHeight = 175;
const subjectHeight = 125;
const subjectWidth = 250;
const padding = 25;
let maxX = 0;
let maxY = 0;
const edgeYOffsets = {};
const edgeXOffsets = {};


const newSubjectInfoData = addHelperNodesAndOffsets(subjectInfoData, subjectOrderData, 
                                                    edgeYOffsets, edgeXOffsets);
console.log(edgeXOffsets);
const yValues = {}
Object.keys(subjectOrderData).forEach((semester) =>
    Object.values(subjectOrderData[semester]).forEach((code, i) => yValues[code] = i)
);

const ITERATIONS = 5;
for (let i = 0; i < ITERATIONS; i++) {
    Object.entries(newSubjectInfoData).forEach(([code, course]) => {
        if (course.successors.length == 0) return;
        let sum = 0;
        let count = 0;
        course.successors.forEach((succ) => {
            if (yValues[succ] !== undefined) {
                sum += yValues[succ];
                count++;
            }
        });
        yValues[code] = sum / count;
    });
}

Object.values(subjectOrderData).forEach((semester) => {
    semester.sort((a, b) => yValues[a] - yValues[b]);
})
console.log(subjectOrderData);

const positions = {}
Object.entries(subjectOrderData).forEach(([semester, courses]) => {
    courses.forEach((course, i) => {
        const x = padding + parseInt(semester - 1) * columnWidth;
        const y = padding + i * rowHeight;
        positions[course] = { x, y }

        if (x + columnWidth > maxX) {maxX = x + columnWidth}
        if (y + rowHeight > maxY) {maxY = y + rowHeight}
    });
});
    
const Visualisation = () => {
    return (
        <div className="visualisationBox" 
                style = {{
                    width: maxX - 75,
                    height: maxY
                }}
        >
            <svg className='connections'>
                {Object.entries(newSubjectInfoData).map(([startCode, course]) => {
                    return course.successors.map((endCode, i) => {

                        const start = positions[startCode];
                        const end = positions[endCode];
                        if (!start || !end) { return null; }
                        const startX = start.x + subjectWidth / 2;
                        const startY = start.y + subjectHeight / 2;
                        const endX = end.x + subjectWidth / 2;
                        const endY = end.y + subjectHeight / 2;
                        const midX = (startX + endX) / 2;

                        let yOffset = edgeYOffsets[`${startCode}-${endCode}`];
                        let xOffset = edgeXOffsets[`${startCode}-${endCode}`];

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
            {Object.entries(newSubjectInfoData).map(([code, course]) => {
                const pos = positions[code];
                if (!pos || course.name == "") return null;
                return (<Subject
                    key={code}
                    code={code}
                    course={course}
                    style={{
                        position: "absolute",
                        left: positions[code].x,
                        top: positions[code].y,
                        width: {subjectWidth},
                        height: {subjectHeight}
                    }}
                />)
            })}
        </div> 
    );
}

export default Visualisation