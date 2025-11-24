import { Course } from "@/types/subjects";
import Subject from "@components/Subject/Subject"
import ChoiceConnections from "@components/SubjectDetailMenu/ChoiceConnections";
import { useData } from "@components/providers/dataProvider";

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;


type SubjectListItemProps = {
    code: string,
    course: Course
}


function SubjectListItem({code, course} : SubjectListItemProps) {
    const subjectInfoData = useData();
    let isAlsoOutside = Object.values(subjectInfoData.order)
                    .some(semester => semester
                        .some(subject => "code" in subject && subject.code == code));
    return (
        <div 
            title = {isAlsoOutside ? "Nachází se již jako předmět mimo tento výběr." : undefined}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: isAlsoOutside ? 0.5 : 1
            }}>
            <ChoiceConnections
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
                    setDragEnabled={() => {}}
            />
            <ChoiceConnections 
                course={course}
                subjectWidth={subjectWidth}
                isPredecessor={false}
            />
        </div>
    )

}

export default SubjectListItem