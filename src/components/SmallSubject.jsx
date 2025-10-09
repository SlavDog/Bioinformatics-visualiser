import './Subject.css'

const SmallSubject = ({ code, course, style }) => {
    const link = "https://is.muni.cz" + course.link;
    return (
        <div className={`subject subjectType${course.type}`} style={{...style, borderRadius: "0px", borderWidth: "4px"}}>
            <div className="smallTopSubjectContainer">
                <a className="smallSubjectCode" draggable="false" href={link}>{code}</a>
            </div>
            <div style={{ backgroundColor: "#a5a5a5", height: "2px", width: "50%", alignSelf: 'center' }}></div>
            <div className="smallBottomSubjectContainer">
                <p className="smallSubjectCredits">{course.credits} kr.</p>
            </div>
        </div>
    );
}

export default SmallSubject