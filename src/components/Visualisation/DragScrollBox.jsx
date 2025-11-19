import { useRef, useState, useEffect } from 'react';
import Visualisation from '@components/Visualisation/Visualisation';
import SideBar from '@components/layouts//SideBar/SideBar';
import RangeScaler from '@components/ui/RangeScaler/RangeScaler';

function DragScrollBox() {
    const boxRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(true);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    const onMouseDown = (e) => {
        if (!dragEnabled) return;
        if (e.target.closest(".sideBar") || e.target.closest(".rangeScaler")) {
            return;
        }
        setIsDragging(true);
        setStartX(e.screenX);
        setStartY(e.screenY);
    }

    const [scale, setScale] = useState(0.7);

    useEffect(() => {

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const distanceX = e.screenX - startX;
            const distanceY = e.screenY - startY;

            let newScrollLeft = boxRef.current.scrollLeft - distanceX;
            let newScrollTop = boxRef.current.scrollTop - distanceY;

            // clamp
            boxRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft,
                boxRef.current.scrollWidth - boxRef.current.clientWidth));
            boxRef.current.scrollTop = Math.max(0, Math.min(newScrollTop,
                boxRef.current.scrollHeight - boxRef.current.clientHeight));

            setStartX(e.screenX);
            setStartY(e.screenY);
        };

        const onMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        } else {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        }

        // Clean listeners if element is removed
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [isDragging, startX, startY]);


    return (
        <>
            <div
                className="scrollableBox"
                ref={boxRef}
                onMouseDown={onMouseDown}
            >
                <div style={{ position: 'absolute', top: "5vh", left: "6vw", zIndex: 100, width: "200px" }}>
                    <RangeScaler scale={scale} setScale={setScale} />
                    <SideBar/>
                </div>
                <Visualisation scale={scale} setDragEnabled={setDragEnabled}/>
            </div>
        </>
  );
}

export default DragScrollBox