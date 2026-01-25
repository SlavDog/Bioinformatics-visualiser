import './styles.css'
import { useState } from 'react';
import SubjectDetailMenu from '@components/SubjectDetailMenu/SubjectDetailMenu';
import { Course } from '@/types/subjects';
import Warning from '@components/Subject/Warning';
import BioIcon from '@/assets/bio.svg'
import InfIcon from '@/assets/inf.svg'
import MathIcon from '@/assets/math.svg'
import ChoiceIcon from '@/assets/choice.svg'
import OtherIcon from '@/assets/other.svg'
import { typeCodeToName } from '@utils/textHelpers';


export type SubjectProps = {
    code: string;
    course: Course;
    isAlsoOutside: boolean;
    style: React.CSSProperties;
    setDragEnabled: (b: boolean) => void;
}


function Subject({ code, course, isAlsoOutside = false, style, setDragEnabled } : SubjectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const link = "https://is.muni.cz" + course.link;

    let Info = <><p className="subjectCode">{code}</p>
                 <a className="subjectName" draggable="false" href={link} target='_blank'>{course.name}</a>
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

    const WarningComponent = isAlsoOutside ? <Warning/> : null;

    let limit = course.credits ?? course.subjects;

    return (
        <>
            <div onClick={onClick} className={`subject subjectType${course.type}`} style={style}>
                <div className="topSubjectContainer">
                    {Info}
                    {WarningComponent}
                </div>
                <div className="bottomSubjectContainer">
                    <div className="iconContainer">
                        <img src={course.type === "IN" ? InfIcon : course.type === "BI" ? BioIcon : course.type === "MA" ? MathIcon : course.type === "choice" ? ChoiceIcon : OtherIcon} title={typeCodeToName(course.type)} draggable="false" className='circle' />
                        <div className="circle"></div>
                    </div>
                    <p className="subjectCredits">{limit} {course.credits ? "kr." : "předm."}</p>
                </div>
            </div>
            <SubjectDetailMenu
                open={isOpen}
                onClose={() => {setIsOpen(false); setDragEnabled(true);}}
                source={detailMenuSourceName}
                setIsOpen={setIsOpen}
                credits={limit}
            />
        </>
    );
}

export default Subject