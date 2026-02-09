import Connections from "@components/Visualisation/Connections";
import { getOrGatesYOffsetsForSubject } from "@utils/Graph";
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
    orGatesPositions: Array<{x: number, y: number}>
}

function visualisationForeground({edgeXOffsets, edgeYOffsets, 
        positions, processedSubjects, choices,
        SubjectComponent, setDragEnabled,
        orGatesPositions} : VisualisationForegroundProps) {
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
            <OrGates orGatesPositions={orGatesPositions}/>
            {Object.entries(processedSubjects).map(([code, course]) => {
                const pos = positions[code];
                if (!pos) {return null;}
                if (course.name == "") { return <p key={code} style={{position: "absolute", left: positions[code].x,
                                top: positions[code].y}}>{code}</p>; }

                const orGatesPositions = getOrGatesPositionsForSubject(code, course, processedSubjects, edgeYOffsets);
                return (
                    <>
                        <SubjectComponent
                            code={code}
                            key={code}
                            course={course}
                            isAlsoOutside={false}
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
                    </>
                );
            })}
        </div>
    );
}

export default visualisationForeground;