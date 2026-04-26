import { RefObject, useEffect, useState } from 'react';

function useDragScroll(
    boxRef: RefObject<HTMLElement>,
    dragEnabled: boolean
): (e: MouseEvent) => void {
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    const onMouseDown = (e: MouseEvent) => {
        if (!dragEnabled) return;
        setIsDragging(true);
        setStartX(e.screenX);
        setStartY(e.screenY);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging || !boxRef.current) return;

            const distanceX = e.screenX - startX;
            const distanceY = e.screenY - startY;

            let newScrollLeft = boxRef.current.scrollLeft - distanceX;
            let newScrollTop = boxRef.current.scrollTop - distanceY;

            // clamp
            boxRef.current.scrollLeft = Math.max(
                0,
                Math.min(newScrollLeft, boxRef.current.scrollWidth - boxRef.current.clientWidth)
            );
            boxRef.current.scrollTop = Math.max(
                0,
                Math.min(newScrollTop, boxRef.current.scrollHeight - boxRef.current.clientHeight)
            );

            setStartX(e.screenX);
            setStartY(e.screenY);
        };

        const onMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, startX, startY]);

    return onMouseDown;
}

export default useDragScroll;
