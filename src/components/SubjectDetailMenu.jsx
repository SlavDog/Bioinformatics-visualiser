import './Subject.css'
import subjectInfoData from '../data/final_tree.json'
import Subject from './Subject';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const subjectHeight = 140;
const subjectWidth = 250;
const subjectPadding = 16;

const SubjectDetailMenu = ({open, onClose, source, credits}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
    

    const handleEscape = (event) => { if (event.key === "Escape") { onClose(); }}
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            setIsClosing(false);
            setIsAnimatingOpen(false);

            // Adding delay so that the element is already
            // added to DOM when we render the animation
            document.addEventListener("keydown", handleEscape);
            setTimeout(() => setIsAnimatingOpen(true), 20);
        } else if (isVisible) {
            setIsClosing(true);
            document.removeEventListener("keydown", handleEscape);
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [open]);

    if (!isVisible) return null;

    const choiceLimit = subjectInfoData["choices"][source].type;
    const [subjectLimit, creditsLimit] = choiceLimit.split(":").map(Number);
    let limitText = `V tomto semestru si doporučujeme zapsat ${credits} kr. z celkově potřebných ${creditsLimit} kr. z následujícího výběru:`
    if (subjectLimit != 0) {
        let subjectDeclination = credits == 1 ? "předmět" : (credits >= 2 && credits < 5 ? "předměty" : "předmětů")
        let sentenceEnd = subjectLimit > 1 ? `z ${subjectLimit} předmětů celkově potřebných z následujícího výběru:` : "z následujícího výběru:"
        limitText = `V tomto semestru si doporučujeme zapsat ${credits} ${subjectDeclination} ${sentenceEnd}`
    } 
    return createPortal(
    <>
        <div className={`overlay ${isClosing ? "closingOverlay" : isAnimatingOpen ? "openingOverlay" : ""}`} onClick={onClose}></div>
        <div className={`subjectDetailMenuBox ${isClosing ? "closingBox" : isAnimatingOpen ? "openingBox" : ""}`}>
            <p className='bigTitle'>Předměty volby <u>{subjectInfoData["choices"][source]["refnCZ"]}</u></p>
            <p className='bigSubTitle'>{limitText}</p>
            <button onClick={onClose} className='zoomButton' style={{position: "absolute", right: "14px", top: "14px"}}>❌</button>
            <div className="menuBoxSubjectsContainer">
                {Object.values(subjectInfoData["choices"][source]["list"]).map((code) => {
                    if (source == "tv") { 
                        return <button onClick={() => window.open('https://www.fsps.muni.cz/cus/vyuka/predmety-povinne-telesne-vychovy', '_blank')} className='zoomButton'>Zobrazit aktuální nabídku tělocviků 👟</button>
                    }
                    if (source=="CORE") {
                        return <button onClick={() => window.open('https://www.muni.cz/studenti/kazdodenni-studium/spolecny-univerzitni-zaklad/co-jsou-core-predmety', '_blank')} className='zoomButton'>Zobrazit aktuální nabídku CORE předmětů 🎓</button>
                    }
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
                                    strokeDasharray="2 2 5 2" 
                                    strokeWidth="2" />
                                <text 
                                    x={subjectWidth / 2} 
                                    y="10" 
                                    textAnchor="middle" 
                                    fontSize="12"
                                    fontFamily='Inter'
                                    fill={predLineColor}
                                >
                                    ⬇️ Předcházející: {course.predecessors.map(subject => subject.code).join(', ')}
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
                                    x2={subjectWidth / 2} y2="35" 
                                    stroke={succLineColor}
                                    strokeDasharray="2 2 5 2"
                                    strokeWidth="2" />
                                <text 
                                    x={subjectWidth / 2} 
                                    y="50" 
                                    textAnchor="middle" 
                                    fontSize="12"
                                    fontFamily='Inter'
                                    fill={succLineColor}
                                >
                                    ⬇️ Navazující: {course.successors.map(subject => subject.code).join(', ')}
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