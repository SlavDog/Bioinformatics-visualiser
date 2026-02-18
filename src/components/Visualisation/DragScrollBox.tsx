import { useRef, useState} from 'react';
import Visualisation from '@components/Visualisation/Visualisation';
import SideBar from '@components/SideBar/SideBar';
import { Layout } from '@/consts/VisualisationParameters';
import useDragScroll from '@/hooks/useDragScroll';
import useWheelZoom from '@/hooks/useWheelZoom';

function DragScrollBox() {
    const [scale, setScale] = useState(0.7);
    const [dragEnabled, setDragEnabled] = useState(true);
    const boxRef = useRef(null);

    useWheelZoom(setScale);
    const onMouseDown = useDragScroll(boxRef, dragEnabled);

    return (
        <>
            <div
                className="visualisationBox"
            >
                <SideBar scale={scale} setScale={setScale}/>
                <div className="scrollableBox"
                    ref={boxRef}
                    onMouseDown={onMouseDown}
                    style={{
                        marginLeft: `${Layout.sidebarWidth + 42}px` // 42 = sidebar padding and border
                    }}
                >
                    <Visualisation scale={scale} setDragEnabled={setDragEnabled}/>
                </div>
            </div>
        </>
  );
}

export default DragScrollBox