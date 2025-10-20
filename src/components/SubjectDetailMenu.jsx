import './Subject.css'
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';

import { createPortal } from 'react-dom';

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

const SubjectDetailMenu = ({open, onClose, source}) => {
    if (!open) return null;
    return createPortal(
    <>
        <div className="overlay"></div>
            <div className="subjectDetailMenuBox">
                <p className='bigTitle'>Předměty volby <u>{subjectInfoData["choices"][source]["refnCZ"]}</u></p>
                <button onClick={onClose} className='zoomButton' style={{position: "absolute", right: "14px", top: "14px"}}>❌</button>
                <div className="menuBoxSubjectsContainer">
                    {Object.values(subjectInfoData["choices"][source]["list"]).map((code) => {
                        if (source == "tv" || source == "CORE") return "TV or CORE";
                        return (<Subject
                            key={code}
                            code={code}
                            course={subjectInfoData["details"][code]}
                            style={{
                                width: subjectWidth,
                                height: subjectHeight,
                                padding: subjectPadding,
                                transform: "scale(0.9)"
                            }}
                        />)
                    })}
                </div>
            </div>
    </>, document.getElementById('SubjectDetailMenuPortal'))
}

export default SubjectDetailMenu;