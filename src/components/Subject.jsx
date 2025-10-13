import './Subject.css'

const Subject = ({ code, course, style }) => {
    const link = "https://is.muni.cz" + course.link;
    let Info = <><p className="subjectCode">{code}</p>
                 <a className="subjectName" draggable="false" href={link}>{course.name}</a>
                 <p className="subjectInfo">{course.faculty} / {course.language} / {course.completion}</p></>;
    if (course.type == "choice") {
        Info = <><p className="subjectCode">Předměty ze sekce:</p>
                 <p className="subjectName">{course.name}</p></>
    }
        return (
            <div className={`subject subjectType${course.type}`} style={style}>
                <div className="topSubjectContainer">
                    {Info}
                </div>
                <div className="bottomSubjectContainer">
                    <div className="iconContainer">
                        <div className="circle"></div>
                        <div className="circle"></div>
                    </div>
                    <p className="subjectCredits">{course.credits} kr.</p>
                </div>
            </div>
        );
}

export default Subject