import subjectOrderData from './order.json';
import subjectInfoData from './final_tree.json'
import Subject from './Subject';

function Visualisation() {
    const columnWidth = 400;
    const rowHeight = 250;
    
    const positions = {}
    Object.entries(subjectOrderData).forEach(([semester, courses]) => {
        courses.forEach((course, i) => {
            positions[course] = {
                x: parseInt(semester - 1) * columnWidth,
                y: i * rowHeight
            };
        });
    });
    return (
        <div className="visualisationBox">
            {Object.entries(subjectInfoData).map(([code, course]) => {
                const pos = positions[code];
                if (!pos) return null;
                return (<Subject
                    key={code}
                    code={code}
                    name={course.name}
                    faculty={course.faculty}
                    language={course.language}
                    completion={course.completion}
                    credits={course.credits}
                    style={{
                        position: "absolute",
                        left: positions[code].x,
                        top: positions[code].y
                    }}
                />)
            })}
        </div>
    );
}

export default Visualisation