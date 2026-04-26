import Tippy from '@tippyjs/react';
import './styles.css';
import { ZoomScale } from '@/consts/visualisationParameters';

type RangeScalerProps = {
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
};

function RangeScaler({ scale, setScale }: RangeScalerProps) {
    return (
        <div className="rangeScaler desktopOnly">
            <label>Velikost</label>
            <Tippy placement="bottom-end" content="Velikost lze měnit také pomocí Ctrl + scroll">
                <div
                    className="helpIcon"
                    style={{ width: '12px', height: '12px', marginLeft: '2px', fontSize: '10px' }}
                >
                    ?
                </div>
            </Tippy>
            <input
                type="range"
                min={ZoomScale.logMin}
                max={ZoomScale.logMax}
                step="any"
                value={Math.log(scale)}
                onChange={(e) => setScale(Math.exp(Number(e.target.value)))}
            ></input>
        </div>
    );
}

export default RangeScaler;
