import { useRef, useState } from 'react';
import Visualisation from '@components/Visualisation/Visualisation';
import SideBar from '@components/SideBar/SideBar';
import { ZoomScale } from '@/consts/visualisationParameters';
import useDragScroll from '@/hooks/useDragScroll';
import useWheelZoom from '@/hooks/useWheelZoom';

function DragScrollBox() {
    const [scale, setScale] = useState(ZoomScale.default);
    const [dragEnabled, setDragEnabled] = useState(true);
    const boxRef = useRef<HTMLDivElement>(null);

    useWheelZoom(setScale);
    const onMouseDown = useDragScroll(boxRef, dragEnabled);

    return (
        <>
            <div className="visualisationBox">
                <SideBar scale={scale} setScale={setScale} />
                <div className="scrollableBox" ref={boxRef} onMouseDown={onMouseDown}>
                    <Visualisation scale={scale} setDragEnabled={setDragEnabled} />
                </div>
            </div>
        </>
    );
}

export default DragScrollBox;
