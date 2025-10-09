import './Subject.css'

const Subject = ({ code, course, style }) => {
    const link = "https://is.muni.cz" + course.link;
    return (
        <div className={`subject subjectType${course.type}`} style={style}>
            <div className="topSubjectContainer">
                <p className="subjectCode">{code}</p>
                <a className="subjectName" draggable="false" href={link}>{course.name}</a>
                <p className="subjectInfo">{course.faculty} / {course.language} / {course.completion}</p>
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