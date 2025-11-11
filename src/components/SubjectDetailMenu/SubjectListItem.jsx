import Subject from "../Subject/Subject"
import ChoiceConnection from "./ChoiceConnection";

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

function SubjectListItem({code, course}) {
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <ChoiceConnection 
                course={course}
                subjectWidth={subjectWidth}
                isPredecessor={true}
            />
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
            <ChoiceConnection 
                course={course}
                subjectWidth={subjectWidth}
                isPredecessor={false}
            />
        </div>
    )

}

export default SubjectListItem