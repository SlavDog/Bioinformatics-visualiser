import orGateIcon from '@/assets/or_gate.svg';
import { Layout } from '@/consts/visualisationParameters';
import Tippy from '@tippyjs/react';

type OrGatesProps = {
    orGatesPositions: Array<{ x: number; y: number }>;
    scale: number;
};

function OrGates({ orGatesPositions, scale }: OrGatesProps) {
    const orGateSize = Layout.orGateSize * (1 / Math.log(scale + 1));
    return (
        <>
            {orGatesPositions.map((pos) => (
                <Tippy
                    content="OR brána - stačí splnit jednu z předepsaných možností"
                    key={`tippy-${pos.x}-${pos.y}`}
                >
                    <img
                        src={orGateIcon}
                        alt="OR Gate Icon"
                        className="orGateIcon"
                        key={`orGate-${pos.x}-${pos.y}`}
                        style={{
                            position: 'absolute',
                            left: pos.x - orGateSize,
                            top: pos.y - orGateSize / 2 + 2,
                            width: orGateSize,
                            height: orGateSize
                        }}
                    />
                </Tippy>
            ))}
        </>
    );
}

export default OrGates;
