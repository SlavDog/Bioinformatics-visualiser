export function SemesterColumn({columnWidth, index, semesterSubjects, subjectInfoData}) {
    const semesterCredits = semesterSubjects
        .map(subject => {
            if (!subject.code) return 0;
            const course = subjectInfoData[subject.code];
            return course && course.credits ? Number(course.credits) : 0;
        })
        .reduce((acc, c) => acc + c, 0);

    return (
     <div key={index} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'absolute',
        backgroundColor: index % 2 == 0 ? "#e8e8e8" : "white",
        left: index * columnWidth,
        top: 0,
        height: "100%",
        width: columnWidth                    
    }}>
        <p className='semesterTitles'>{index + 1}. Semestr</p>
        <p className='semesterSubtitles'>Celkem kreditů: {semesterCredits}</p>
    </div>
    )
}

export default SemesterColumn