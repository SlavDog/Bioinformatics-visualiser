type SubjectDetailMenuHeaderProps = {
    choiceName: string;
    limitText: string;
    onClose: () => void;
};

function SubjectDetailMenuHeader({ choiceName, limitText, onClose }: SubjectDetailMenuHeaderProps) {
    return (
        <header>
            <p className="bigTitle">
                Předměty volby <u>{choiceName}</u>
            </p>
            <p className="bigSubTitle">{limitText}</p>
            <button onClick={onClose} className="submitButton closeButton">
                ×
            </button>
        </header>
    );
}

export default SubjectDetailMenuHeader;
