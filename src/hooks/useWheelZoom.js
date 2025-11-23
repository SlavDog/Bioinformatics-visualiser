import { useEffect } from "react";

function useWheelZoom(setScale) {
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
}

export default useWheelZoom;