import SubjectDetailMenuHeader from '@components/SubjectDetailMenu/SubjectDetailMenuHeader';
import SubjectList from '@components/SubjectDetailMenu/SubjectList';
import { getChoiceLimitText } from '@utils/textHelpers';
import { useData } from "@components/providers/dataProvider";
import "./styles.css";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type SubjectDetailMenuProps = {
    open: boolean,
    onClose: () => void;
    source: string;
    credits: number;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function SubjectDetailMenu({open, onClose, source, credits} : SubjectDetailMenuProps) {
    const subjectInfoData = useData();
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
    

    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { onClose(); }}
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

    const sourceChoiceCode = source.replace(/-\d+$/, "");
    const choiceLimit = subjectInfoData["choices"][sourceChoiceCode].type;
    const limitText = getChoiceLimitText(choiceLimit, credits);

    const portalRoot = document.getElementById("SubjectDetailMenuPortal");
    if (!portalRoot) return null;
    return createPortal(
    <>
        <div className={`overlay ${isClosing ? "closingOverlay" : isAnimatingOpen ? "openingOverlay" : ""}`} onClick={onClose}></div>
        <div className={`subjectDetailMenuBox ${isClosing ? "closingBox" : isAnimatingOpen ? "openingBox" : ""}`}>
            <SubjectDetailMenuHeader choiceName={subjectInfoData["choices"][sourceChoiceCode]["refnCZ"]} limitText={limitText} onClose={onClose} />
            <SubjectList source={sourceChoiceCode}/>
        </div>
    </>, portalRoot)
}

export default SubjectDetailMenu;