import './Subject.css'
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

const SubjectDetailMenu = ({open, onClose, source, setIsOpen}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
    
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            setIsClosing(false);
            setIsAnimatingOpen(false);

            // Adding delay so that the element is already
            // added to DOM when we render the animation
            setTimeout(() => setIsAnimatingOpen(true), 20);
        } else if (isVisible) {
            setIsClosing(true);
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [open]);
    
    if (!isVisible) return null;
    return createPortal(
    <>
        <div className={`overlay ${isClosing ? "closingOverlay" : isAnimatingOpen ? "openingOverlay" : ""}`} onClick={onClose}></div>
        <div className={`subjectDetailMenuBox ${isClosing ? "closingBox" : isAnimatingOpen ? "openingBox" : ""}`}>
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