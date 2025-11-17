function SubjectDetailMenuHeader({ choiceName, limitText, onClose }) {
    return (
        <header>
            <p className='bigTitle'>Předměty volby <u>{choiceName}</u></p>
            <p className='bigSubTitle'>{limitText}</p>
            <button onClick={onClose} className='zoomButton' style={{position: "absolute", right: "14px", top: "14px"}}>❌</button>
        </header>
    );
}

export default SubjectDetailMenuHeader