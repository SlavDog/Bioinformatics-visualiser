import { Course } from '@/types';
import Subject from '@components/Subject/Subject';
import ChoiceConnections from '@components/SubjectDetailMenu/ChoiceConnections';
import {
    useData,
    useHighlightedSubjects,
    useSelectedChoices,
    useSelectedSpecialization,
    useSetHighlightedSubjects,
    useToggleChoice
} from '@components/providers/dataProvider';
import { Layout } from '@/consts/visualisationParameters';
import { OrderSubject } from '@/types';
import { useEffect } from 'react';

type SubjectListItemProps = {
    code: string;
    course: Course;
    choiceCode: string;
};

function SubjectListItem({ code, course, choiceCode }: SubjectListItemProps) {
    const subjectInfoData = useData();

    const toggle = useToggleChoice();
    const selectedChoices = useSelectedChoices();
    const setHighlightedSubjects = useSetHighlightedSubjects();

    useEffect(() => {
        if (selectedChoices[choiceCode]?.has(code)) {
            setHighlightedSubjects((prev) => new Set([...prev, code]));
        } else {
            setHighlightedSubjects((prev) => {
                const newSet = new Set(prev);
                newSet.delete(code);
                return newSet;
            });
        }
    }, [selectedChoices, choiceCode, code]);

    let isAlsoOutside = Object.values(subjectInfoData.spec).some((specializationObj) =>
        Object.values(specializationObj.plan).some((semester) =>
            semester.some((subject) => 'code' in subject && subject.code == code)
        )
    );
    return (
        <div
            className="choiceMenuSelectionBox"
            onClick={isAlsoOutside ? () => {} : () => toggle(choiceCode, code)}
        >
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
                dim={false}
                style={{
                    width: Layout.detailMenuSubjectWidth,
                    height: Layout.detailMenuSubjectHeight,
                    padding: Layout.detailMenuSubjectPadding
                }}
                setDragEnabled={() => {}}
            />
            <ChoiceConnections
                course={course}
                subjectWidth={Layout.detailMenuSubjectWidth}
                isPredecessor={false}
            />
        </div>
    );
}

export default SubjectListItem;
