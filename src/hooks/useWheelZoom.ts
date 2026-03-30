import { ZoomScale } from "@/consts/VisualisationParameters";
import { useEffect, useRef } from "react";

function useWheelZoom(setScale: React.Dispatch<React.SetStateAction<number>>) {
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            setScale(prev => {
                const logScale = Math.log(prev) - e.deltaY * 0.01;
                const clamped = Math.min(Math.max(logScale, ZoomScale.logMin), ZoomScale.logMax);
                return Math.exp(clamped);
            });
        };

        window.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            window.removeEventListener("wheel", onWheel);
        };
    }, []);
}

export default useWheelZoom;