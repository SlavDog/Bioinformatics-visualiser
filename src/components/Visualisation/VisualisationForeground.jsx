import Connections from "@components/Visualisation/Connections";
import { isInSomeChoice } from "@utils/Graph";
import { getOrGatesPositionsForSubject } from "@utils/Graph";
import { Layout } from "@/consts/VisualisationParameters";
import OrGates from "@components/Visualisation/OrGates";

function visualisationForeground({edgeXOffsets, edgeYOffsets, 
        positions, processedSubjects, choices,
        SubjectComponent, setDragEnabled}) {
    return (
        <div className="visualisationForeground">
            <Connections 
                processedSubjects={processedSubjects}
                positions={positions}
                xOffsets={edgeXOffsets}
                yOffsets={edgeYOffsets}
            />
            {Object.entries(processedSubjects).map(([code, course]) => {
                const pos = positions[code];
                if (!pos || course.name == "") { return null; }

                const orGatesPositions = getOrGatesPositionsForSubject(code, course, processedSubjects, edgeYOffsets);
                return (
                    <>
                        <SubjectComponent
                            code={code}
                            key={code}
                            course={course}
                            setDragEnabled={setDragEnabled}
                            style={{
                                position: "absolute",
                                left: positions[code].x,
                                top: positions[code].y,
                                width: Layout.subjectWidth,
                                height: Layout.subjectHeight,
                                padding: Layout.subjectPadding
                            }}
                        />
                        {orGatesPositions.length != 0 && <OrGates 
                            orGatesPositions={orGatesPositions} 
                            positions={positions}
                            code={code}
                        />}
                    </>
                );
            })}
        </div>
    );
}

export default visualisationForeground;