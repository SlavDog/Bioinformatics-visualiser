const Subject = ({ code, name, faculty, language, completion, credits, style }) => {
    return (
        <div className="subject" style={style}>
            <div className="topSubjectContainer">
                <p className="subjectCode">{code}</p>
                <p className="subjectName">{name}</p>
                <p className="subjectInfo">{faculty} / {language} / {completion}</p>
            </div>
            <div className="bottomSubjectLine">
                <div className="iconContainer">
                    <div className="circle"></div>
                    <div className="circle"></div>
                </div>
                <p className="subjectCredits">{credits} kr.</p>
            </div>
        </div>
    );
}

export default Subject