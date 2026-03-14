import "./styles.css"


type RangeScalerProps = {
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>
}


function RangeScaler({scale, setScale} : RangeScalerProps) {
    return (
        <div className='rangeScaler'>
            <label>Velikost</label>
            <div className="helpIcon" style={{ width: "12px", height: "12px", marginLeft: "2px", fontSize: "10px" }} title="Velikost lze měnit také pomocí Ctrl + scroll">
                ?
            </div>
            <input type="range" id="volume" min="0.3" max="1.5" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
        </div>
    );
}

export default RangeScaler;