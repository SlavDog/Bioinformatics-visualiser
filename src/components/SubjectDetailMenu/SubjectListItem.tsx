import { Course } from "@/types/subjects";
import Subject from "@components/Subject/Subject"
import ChoiceConnections from "@components/SubjectDetailMenu/ChoiceConnections";
import { useData } from "@components/providers/dataProvider";
import { Layout } from "@/consts/VisualisationParameters";


type SubjectListItemProps = {
    code: string,
    course: Course
}


function SubjectListItem({code, course} : SubjectListItemProps) {
    const subjectInfoData = useData();
    let isAlsoOutside = Object.values(subjectInfoData.order)
        .some(specializationObj => 
            Object.values(specializationObj)
                    .some(semester => semester
                        .some(subject => "code" in subject && subject.code == code)));
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
                subjectWidth={Layout.detailMenuSubjectWidth}
                isPredecessor={true}
            />
                <Subject
                    key={code}
                    code={code}
                    course={course}
                    style={{
                        width: Layout.detailMenuSubjectWidth,
                        height: Layout.detailMenuSubjectHeight,
                        padding: Layout.detailMenuSubjectPadding,
                        transform: "scale(0.9)"
                    }}
                    setDragEnabled={() => {}}
            />
            <ChoiceConnections 
                course={course}
                subjectWidth={Layout.detailMenuSubjectWidth}
                isPredecessor={false}
            />
        </div>
    )

}

export default SubjectListItem