import { Course } from "@/types/subjects";
import Subject from "@components/Subject/Subject"
import ChoiceConnections from "@components/SubjectDetailMenu/ChoiceConnections";
import { useData, useSelectedSpecialization } from "@components/providers/dataProvider";
import { Layout } from "@/consts/VisualisationParameters";
import { OrderSubject } from "@/types/subjects";


type SubjectListItemProps = {
    code: string,
    course: Course
}


function SubjectListItem({code, course} : SubjectListItemProps) {
    const spec = useSelectedSpecialization();
    const subjectInfoData = useData();

    let isAlsoOutside = Object.values(subjectInfoData.spec)
        .some(specializationObj => Object.values(specializationObj.plan)
                    .some(semester => semester
                        .some(subject => "code" in subject && subject.code == code)));
    return (
        <div 
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
                    isAlsoOutside={isAlsoOutside}
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