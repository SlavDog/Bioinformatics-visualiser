import './Subject.css'
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

const SubjectDetailMenu = ({open, onClose, source}) => {
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
                    let course = subjectInfoData["details"][code];
                    let predLineColor = course.predecessors.length != 0 ? "black" : "transparent";
                    let succLineColor = course.successors.length != 0 ? "black" : "transparent";

                    return (
                        <div style={{display: "flex", flexDirection: "column", alignItems:"center"}}>
                            <svg width={subjectWidth} height="60">
                                <line 
                                    key="vertline" 
                                    x1={subjectWidth / 2} y1="20" 
                                    x2={subjectWidth / 2} y2="60" 
                                    stroke={predLineColor} 
                                    strokeDasharray="5 5" 
                                    strokeWidth="2" />
                                <text 
                                    x={subjectWidth / 2} 
                                    y="10" 
                                    textAnchor="middle" 
                                    fontSize="12"
                                    fontFamily='Inter'
                                    fill={predLineColor}
                                >
                                    ⬇️ Předcházející: {course.predecessors.join(', ')}
                                </text>
                            </svg>
                                <Subject
                                key={code}
                                code={code}
                                course={course}
                                style={{
                                    width: subjectWidth,
                                    height: subjectHeight,
                                    padding: subjectPadding,
                                    transform: "scale(0.9)"
                                }}
                            />
                            <svg width={subjectWidth} height="60">
                                <line 
                                    key="vertline" 
                                    x1={subjectWidth / 2} y1="0"
                                    x2={subjectWidth / 2} y2="40" 
                                    stroke={succLineColor}
                                    strokeDasharray="5 5"
                                    strokeWidth="2" />
                                <text 
                                    x={subjectWidth / 2} 
                                    y="50" 
                                    textAnchor="middle" 
                                    fontSize="12"
                                    fontFamily='Inter'
                                    fill={succLineColor}
                                >
                                    ⬇️ Navazující: {course.successors.join(', ')}
                                </text>
                            </svg>
                        </div>
                    )
                })}
            </div>
        </div>
    </>, document.getElementById('SubjectDetailMenuPortal'))
}

export default SubjectDetailMenu;