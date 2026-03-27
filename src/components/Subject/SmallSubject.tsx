import { Course } from '@/types/subjects';
import './styles.css'
import SubjectDetailMenu from '@components/SubjectDetailMenu/SubjectDetailMenu';
import { useState } from 'react';
import { useHighlightedSubjects } from '@components/providers/dataProvider';
import Warning from './Warning';


type SmallSubjectProps = {
    code: string,
    course: Course,
    style: React.CSSProperties;
    setDragEnabled: (b: boolean) => void;
}


function SmallSubject({ code, course, style, setDragEnabled } : SmallSubjectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const highlightedSubjects = useHighlightedSubjects();

    const isHighlighted = highlightedSubjects.size > 0 && highlightedSubjects.has(code);
    const isDimmed = highlightedSubjects.size > 0 && !highlightedSubjects.has(code);

    const link = "https://is.muni.cz" + course.link;
    const displayCode = code.replace(/-DUP-\d+$/, "");
    let Info = <a className="smallSubjectCode" draggable="false" href={link}>{displayCode}</a>;
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

    let warnings: Set<string> = new Set();
    if (course.unshownNeededPredecessors != undefined && course.unshownNeededPredecessors.length != 0) { warnings.add("unshownPredecessors"); }
    const WarningComponent = <Warning warnings={warnings} course={course}/>;
    let limit = course.credits;

    return (
        <>
            <div onClick={onClick} className={`subject subjectType${course.type} ${isHighlighted ? "subjectHighlighted" : ""} ${isDimmed ? "subjectDimmed" : ""}`} style={{...style, borderRadius: "0px", borderWidth: "4px"}}>
                <div className="smallTopSubjectContainer">
                    {Info}
                </div>
                <div style={{ backgroundColor: "#a5a5a5", height: "3px", minHeight: "3px", width: "50%", alignSelf: 'center' }}></div>
                <div className="smallBottomSubjectContainer">
                    <p className="smallSubjectCredits">{limit} {course.credits ? "kr." : "předm."}</p>
                    {WarningComponent}
                </div>
            </div>
            <SubjectDetailMenu open={isOpen} onClose={() => {setIsOpen(false); setDragEnabled(true);}} source={detailMenuSourceName} setIsOpen={setIsOpen} credits={limit}/>
        </>
    );
}

export default SmallSubject