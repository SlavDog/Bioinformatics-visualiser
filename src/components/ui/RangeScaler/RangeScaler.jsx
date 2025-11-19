import "./RangeScaler.css"

function RangeScaler({scale, setScale}) {
    return (
        <div className='rangeScaler'>
            <label>Velikost</label>
            <input type="range" id="volume" min="0.5" max="1.5" step="0.1" value={scale} onChange={(e) => setScale(e.target.value)} />
        </div>
    );
}

export default RangeScaler;