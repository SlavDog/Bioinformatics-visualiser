import './styles.css';

type BigButtonProps = {
    color: string;
    text: string;
    onClick: () => void;
};

function BigButton({ color, text, onClick }: BigButtonProps) {
    return (
        <div
            onClick={onClick}
            className={`big-button`}
            style={{ '--button-color': color, '--glow-color': `${color}33` } as React.CSSProperties}
        >
            {text}
        </div>
    );
}

export default BigButton;
