import orGateIcon from '@/assets/or_gate.svg';

type OrGatesProps = {
    orGatesPositions: Array<{ x: number; y: number }>;
};

function OrGates({ orGatesPositions }: OrGatesProps) {
    return (
        <>
            {orGatesPositions.map((pos) => (
                <img
                    src={orGateIcon}
                    alt="OR Gate Icon"
                    className="orGateIcon"
                    key={`orGate-${pos.x}-${pos.y}`}
                    style={{
                        position: 'absolute',
                        left: pos.x - 30,
                        top: pos.y,
                        width: 30,
                        height: 30
                    }}
                />
            ))}
        </>
    );
}

export default OrGates;
