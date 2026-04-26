import { useEffect, useState } from 'react';

function useIsPortrait() {
    const [isPortrait, setIsPortrait] = useState(
        () => window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
        const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isPortrait;
}

export default useIsPortrait;
