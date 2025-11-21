import { Layout } from "@/consts/VisualisationParameters";

function SemesterColumn({index, semesterSubjects, processedSubjects, maxY, semesterCount}) {
    const semesterCredits = semesterSubjects
        .map(subject => {
            if (!subject.code) {
                return subject.credits;
            }
            const course = processedSubjects[subject.code];
            return course && course.credits ? Number(course.credits) : 0;
        })
        .reduce((acc, c) => acc + c, 0);

    console.log(index * Layout.columnWidth + Layout.columnWidth);
    return (
     <div key={index} className="semesterColumn" style={{
        backgroundColor: index % 2 == 0 ? "#e8e8e8" : "white",
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