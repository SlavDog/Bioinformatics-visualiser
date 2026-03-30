import "./styles.css"
import { ZoomScale } from "@/consts/VisualisationParameters";

type RangeScalerProps = {
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>
}


function RangeScaler({scale, setScale} : RangeScalerProps) {
    return (
        <div className='rangeScaler desktopOnly'>
            <label>Velikost</label>
            <div className="helpIcon" style={{ width: "12px", height: "12px", marginLeft: "2px", fontSize: "10px" }} title="Velikost lze měnit také pomocí Ctrl + scroll">
                ?
            </div>
            <input    
                type="range"
                min={ZoomScale.logMin}
                max={ZoomScale.logMax}
                step="0.01"
                value={Math.log(scale)}
                onChange={(e) => setScale(Math.exp(Number(e.target.value)))}
            ></input>
            </div>
    );
}

export default RangeScaler;