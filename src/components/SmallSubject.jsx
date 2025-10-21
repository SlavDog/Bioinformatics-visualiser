import './Subject.css'
import SubjectDetailMenu from './SubjectDetailMenu';
import { useState } from 'react';

const SmallSubject = ({ code, course, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const link = "https://is.muni.cz" + course.link;
    let Info = <a className="smallSubjectCode" draggable="false" href={link}>{code}</a>;
    let onClick = () => {};
    let detailMenuSourceName = "";
    if (course.type == "choice") {
        onClick = () => {
            setIsOpen(true);
            setDragEnabled(false);
        }
        detailMenuSourceName = code;
        Info = <a className="smallSubjectCode">{code}</a>
    }
    return (
        <>
            <div onClick={onClick} className={`subject subjectType${course.type}`} style={{...style, borderRadius: "0px", borderWidth: "4px"}}>
                <div className="smallTopSubjectContainer">
                    {Info}
                </div>
                <div style={{ backgroundColor: "#a5a5a5", height: "2px", width: "50%", alignSelf: 'center' }}></div>
                <div className="smallBottomSubjectContainer">
                    <p className="smallSubjectCredits">{course.credits} kr.</p>
                </div>
            </div>
            <SubjectDetailMenu open={isOpen} onClose={() => {setIsOpen(false); setDragEnabled(true);}} source={detailMenuSourceName} setIsOpen={setIsOpen}/>
        </>
    );
}

export default SmallSubject