import orGateIcon from '@/assets/or_gate.svg';
import { RealPositions } from '@/types/subjects';


type OrGatesProps = {
    orGatesPositions: Array<number>,
    positions: RealPositions,
    code: string
}


function OrGates({orGatesPositions, positions, code} : OrGatesProps) {
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