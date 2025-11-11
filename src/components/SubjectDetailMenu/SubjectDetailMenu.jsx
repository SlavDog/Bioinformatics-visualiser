import '../Subject.css'
import subjectInfoData from '../../data/final_tree.json'
import SubjectDetailMenuHeader from './SubjectDetailMenuHeader';
import SubjectList from './SubjectList';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
            <SubjectDetailMenuHeader choiceName={subjectInfoData["choices"][source]["refnCZ"]} limitText={limitText} onClose={onClose} />
            <SubjectList source={source}/>
        </div>
    </>, document.getElementById('SubjectDetailMenuPortal'))
}

export default SubjectDetailMenu;