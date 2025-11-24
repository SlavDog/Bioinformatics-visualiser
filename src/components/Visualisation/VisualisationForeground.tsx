import Connections from "@components/Visualisation/Connections";
import { getOrGatesPositionsForSubject } from "@utils/Graph";
import { Layout } from "@/consts/VisualisationParameters";
import OrGates from "@components/Visualisation/OrGates";
import { Choices, Details, EdgeOffsets, RealPositions } from "@/types/subjects";
import { Dispatch, SetStateAction } from "react";
import { SubjectProps } from "@components/Subject/Subject";

type VisualisationForegroundProps = {
    edgeXOffsets: EdgeOffsets,
    edgeYOffsets: EdgeOffsets,
    positions: RealPositions,
    processedSubjects: Details,
    choices: Choices,
    SubjectComponent: React.ComponentType<SubjectProps>,
    setDragEnabled: Dispatch<SetStateAction<boolean>>
}

function visualisationForeground({edgeXOffsets, edgeYOffsets, 
        positions, processedSubjects, choices,
        SubjectComponent, setDragEnabled} : VisualisationForegroundProps) {
    return (
        <div className="visualisationForeground"
            style={{
                inset: `${Layout.semesterTitleInset}px 0 0 0`
        }}>
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