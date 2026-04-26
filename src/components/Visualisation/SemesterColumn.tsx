import { Layout } from '@/consts/visualisationParameters';
import { Details, OrderSubject } from '@/types';
import { useSelectedChoices } from '@components/providers/dataProvider';

type SemesterColumnProps = {
    index: number;
    semesterSubjects: Array<OrderSubject>;
    processedSubjects: Details;
    maxY: number;
    semesterCount: number;
};

function SemesterColumn({
    index,
    semesterSubjects,
    processedSubjects,
    maxY,
    semesterCount
}: SemesterColumnProps) {
    const selectedChoices = useSelectedChoices();
    const semesterCredits = semesterSubjects
        .map((subject) => {
            if (!('code' in subject)) {
                // Choice subject – sečti kredity zvolených předmětů
                const selected = selectedChoices[subject.choice] ?? new Set();
                return [...selected].reduce((sum, subjectCode) => {
                    const course = processedSubjects[subjectCode];
                    return sum + (course?.credits ? Number(course.credits) : 0);
                }, 0);
            }
            const course = processedSubjects[subject.code];
            return course?.credits ? Number(course.credits) : 0;
        })
        .reduce((acc, c) => acc + c, 0);

    return (
        <div
            className="semesterColumn"
            style={{
                backgroundColor: index % 2 == 0 ? 'var(--column-even)' : 'var(--column-odd)',
                left: index * Layout.columnWidth,
                width: Layout.columnWidth,
                height: maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding,
                borderRadius:
                    index == 0
                        ? '20px 0 0 20px'
                        : index == semesterCount - 1
                          ? '0 20px 20px 0'
                          : '0 0 0 0'
            }}
        >
            <p className="semesterTitles">{index + 1}. Semestr</p>
            <p className="semesterSubtitles">Celkem kreditů: {semesterCredits}</p>
        </div>
    );
}

export default SemesterColumn;
