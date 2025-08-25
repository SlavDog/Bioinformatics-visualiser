import { useRef, useState, useEffect } from 'react';
import Visualisation from './Visualisation';

const DragScrollBox = () => {
    const boxRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    const onMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.screenX);
        setStartY(e.screenY);
    }
    
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
    <div
      className="scrollableBox"
      ref={boxRef}
      onMouseDown={onMouseDown}
    >
      <Visualisation/>
    </div>
  );
}

export default DragScrollBox