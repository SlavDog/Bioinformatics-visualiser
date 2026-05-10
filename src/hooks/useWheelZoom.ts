import { ZoomScale } from '@/consts/visualisationParameters';
import { useEffect } from 'react';

function useWheelZoom(setScale: React.Dispatch<React.SetStateAction<number>>) {
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            setScale((prev) => {
                const rawDelta = e.deltaMode === 0 ? e.deltaY : e.deltaY * 30;
                const isTrackpad = Math.abs(rawDelta) < 50;
                const delta = isTrackpad ? rawDelta * 0.01 : Math.sign(rawDelta) * 0.15;
                const logScale = Math.log(prev) - delta;
                const clamped = Math.min(Math.max(logScale, ZoomScale.logMin), ZoomScale.logMax);
                return Math.exp(clamped);
            });
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            window.removeEventListener('wheel', onWheel);
        };
    }, []);
}

export default useWheelZoom;
