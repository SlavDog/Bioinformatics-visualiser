import useIsPortrait from '@/hooks/useIsPortrait';
import { Course } from '@/types';
import { useData } from '@components/providers/dataProvider';
import ChoiceConnection from '@components/SubjectDetailMenu/ChoiceConnection';

type ChoiceConnectionsProps = {
    course: Course;
    subjectWidth: number;
    isPredecessor: boolean;
};

function ChoiceConnections({ course, subjectWidth, isPredecessor }: ChoiceConnectionsProps) {
    const subjectInfoData = useData();
    const horizontal = useIsPortrait();
    let subjectsList = isPredecessor ? course.predecessors : course.successors;
    let voluntarySubjectsArray = subjectsList
        .map((subject) => subject.code)
        .filter((code) => !Object.keys(subjectInfoData['details']).includes(code));
    let compulsorySubjectsArray = subjectsList
        .map((subject) => subject.code)
        .filter((code) => Object.keys(subjectInfoData['details']).includes(code));
    let voluntarySubjectsText = `${isPredecessor ? 'Předměty, na které tento kurz navazuje' : 'Předměty navazující na tento kurz'} (nepovinné):\n${voluntarySubjectsArray.join(', ')}`;
    let compulsorySubjectsText = `${isPredecessor ? 'Předměty, na které tento kurz navazuje' : 'Předměty navazující na tento kurz'} (povinné):\n${compulsorySubjectsArray.join(', ')}`;

    let allSoft = subjectsList.every((edge) => !edge.by_prerequisites);

    let yStart = isPredecessor ? 25 : 5;
    let yEnd = isPredecessor ? 55 : 30;
    let x = subjectWidth / 4;

    let compulsoryColor =
        compulsorySubjectsArray.length == 0 ? 'transparent' : 'var(--text-primary)';
    let voluntaryColor =
        voluntarySubjectsArray.length == 0 ? 'transparent' : 'var(--text-secondary)';

    return (
        <div className="choiceConnectionsWrapper">
            <ChoiceConnection
                horizontal={horizontal}
                color={compulsoryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                allSoft={allSoft}
                text={compulsorySubjectsText}
            />
            <ChoiceConnection
                horizontal={horizontal}
                color={voluntaryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                allSoft={false}
                text={voluntarySubjectsText}
            />
        </div>
    );
}

export default ChoiceConnections;
