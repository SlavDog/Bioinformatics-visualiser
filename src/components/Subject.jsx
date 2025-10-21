import './Subject.css'
import { useState } from 'react';
import SubjectDetailMenu from './SubjectDetailMenu';

const Subject = ({ code, course, style, setDragEnabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const link = "https://is.muni.cz" + course.link;

    let Info = <><p className="subjectCode">{code}</p>
                 <a className="subjectName" draggable="false" href={link}>{course.name}</a>
                 <p className="subjectInfo">{course.faculty} / {course.language} / {course.completion}</p></>;
    let onClick = () => {};
    let detailMenuSourceName = "";
    if (course.type == "choice") {
        Info = <><p className="subjectCode">Předměty ze sekce:</p>
                 <p className="subjectName">{course.name}</p></>
        onClick = () => {
            setIsOpen(true);
            setDragEnabled(false);
        }
        detailMenuSourceName = code;
    }

        return (
            <>
                <div onClick={onClick} className={`subject subjectType${course.type}`} style={style}>
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
                <SubjectDetailMenu open={isOpen} onClose={() => {setIsOpen(false); setDragEnabled(true);}} source={detailMenuSourceName} setIsOpen={setIsOpen}/>
            </>
        );
}

export default Subject