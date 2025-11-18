import { Layout } from "@/consts/VisualisationParameters";

function SemesterColumn({index, semesterSubjects, processedSubjects, maxY}) {
    const semesterCredits = semesterSubjects
        .map(subject => {
            if (!subject.code) return 0;
            const course = processedSubjects[subject.code];
            return course && course.credits ? Number(course.credits) : 0;
        })
        .reduce((acc, c) => acc + c, 0);

    return (
     <div key={index} className="semesterColumn" style={{
        backgroundColor: index % 2 == 0 ? "#e8e8e8" : "white",
        left: Layout.padding + index * Layout.columnWidth,
        top: 100,
        width: Layout.columnWidth,
        height: maxY + 300
    }}>
        <p className='semesterTitles'>{index + 1}. Semestr</p>
        <p className='semesterSubtitles'>Celkem kreditů: {semesterCredits}</p>
    </div>
    )
}

export default SemesterColumn