import orGateIcon from '../assets/or_gate.svg';

function OrGates({orGatesPositions, positions, code}) {
    return (<>
        {orGatesPositions.map((pos, i) =>
            <img src={orGateIcon} alt="OR Gate Icon" className="orGateIcon" key={`orGate-${code}-${i}`} style={{
                position: "absolute",
                left: positions[code].x - 30,
                top: pos,
                width: 30,
                height: 30
            }}/>
        )}
    </>)
}

export default OrGates