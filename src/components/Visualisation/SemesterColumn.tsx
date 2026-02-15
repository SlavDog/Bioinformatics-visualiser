import { Layout } from "@/consts/VisualisationParameters";
import { Details, OrderSubject } from "@/types/subjects";


type SemesterColumnProps = {
    index: number,
    semesterSubjects: Array<OrderSubject>,
    processedSubjects: Details,
    maxY: number,
    semesterCount: number
}


function SemesterColumn({index, semesterSubjects, processedSubjects, maxY, semesterCount} : SemesterColumnProps) {
    const semesterCredits = semesterSubjects
        .map(subject => {
            if (!("code" in subject)) {
                return subject.credits ?? 0;
            }
            const course = processedSubjects[subject.code];
            return course && course.credits ? Number(course.credits) : 0;
        })
        .reduce((acc, c) => acc + c, 0);

    return (
     <div key={index} className="semesterColumn" style={{
        backgroundColor: index % 2 == 0 ? "var(--column-even)" : "var(--column-odd)",
        left: index * Layout.columnWidth,
        width: Layout.columnWidth,
        height: maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding,
        borderRadius: index == 0 ? "20px 0 0 20px" : index == semesterCount - 1 ? "0 20px 20px 0" : "0 0 0 0"
    }}>
        <p className='semesterTitles'>{index + 1}. Semestr</p>
        <p className='semesterSubtitles'>Celkem kreditů: {semesterCredits}</p>
    </div>
    )
}

export default SemesterColumn