import { Course } from "@/types/subjects";
import Subject from "@components/Subject/Subject"
import ChoiceConnections from "@components/SubjectDetailMenu/ChoiceConnections";
import { useData, useSelectedChoices, useSelectedSpecialization, useToggleChoice } from "@components/providers/dataProvider";
import { Layout } from "@/consts/VisualisationParameters";
import { OrderSubject } from "@/types/subjects";


type SubjectListItemProps = {
    code: string,
    course: Course,
    choiceCode: string,
}


function SubjectListItem({code, course, choiceCode} : SubjectListItemProps) {
    const spec = useSelectedSpecialization();
    const subjectInfoData = useData();

    const toggle = useToggleChoice();
    const selectedChoices = useSelectedChoices();
    const isSelected = selectedChoices[choiceCode]?.has(code) ?? false;

    let isAlsoOutside = Object.values(subjectInfoData.spec)
        .some(specializationObj => Object.values(specializationObj.plan)
                    .some(semester => semester
                        .some(subject => "code" in subject && subject.code == code)));
    return (
        <div 
            onClick={() => toggle(choiceCode, code)}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                outline: isSelected ? "2px solid var(--connection-primary)" : "2px solid transparent",
                boxShadow: isSelected ? "0px 0px 30px var(--choice)" : "0px 0px 12px transparent",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                padding: "20px 10px"
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