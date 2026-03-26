import { ZoomScale } from "@/consts/VisualisationParameters";
import { useEffect } from "react";

function useWheelZoom(setScale: React.Dispatch<React.SetStateAction<number>>) {
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();  // turns off the default page zoom


            setScale(prev => {
                const logScale = Math.log(prev) - e.deltaY * 0.01;
                return Math.min(Math.max(Math.exp(logScale), ZoomScale.min), ZoomScale.max);
            });
        };

        window.addEventListener("wheel", onWheel, { passive: false });
        return () => window.removeEventListener("wheel", onWheel);
    }, []);
}

export default useWheelZoom;