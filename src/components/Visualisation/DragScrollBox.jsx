import { useRef, useState, useEffect } from 'react';
import Visualisation from '@components/Visualisation/Visualisation';
import SideBar from '@components/layouts//SideBar/SideBar';
import { Layout } from '@/consts/VisualisationParameters';

function DragScrollBox() {
    const boxRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(true);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scale, setScale] = useState(0.7);

    const onMouseDown = (e) => {
        if (!dragEnabled) return;
        setIsDragging(true);
        setStartX(e.screenX);
        setStartY(e.screenY);
    }


    useEffect(() => {
        const onWheel = (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();  // turns off the default page zoom


            if (e.deltaY < 0) {
                setScale(prev => Math.min(prev + 0.1, 1.5));
            } else {
                setScale(prev => Math.max(prev - 0.1, 0.5));
            }
        };

        window.addEventListener("wheel", onWheel, { passive: false });
        return () => window.removeEventListener("wheel", onWheel);
    }, []);


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