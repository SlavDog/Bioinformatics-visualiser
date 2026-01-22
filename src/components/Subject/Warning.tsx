function Warning() {
    return (
        <div className="subjectOutsideWarningContainer"
            title="Tento předmět je již ve tvém plánu.">
            <p className="warningSymbol">!</p>
            <p className="subjectOutsideWarning">Tento předmět již je ve tvém plánu.</p>
        </div>
    );
}

export default Warning;