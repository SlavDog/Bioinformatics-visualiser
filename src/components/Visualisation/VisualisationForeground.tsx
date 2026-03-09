import Connections from "@components/Visualisation/Connections";
import { getOrGatesYOffsetsForSubject } from "@utils/Graph";
import { Layout } from "@/consts/VisualisationParameters";
import OrGates from "@components/Visualisation/OrGates";
import { Choices, Details, EdgeOffsets, RealPositions, Spec, Specialization } from "@/types/subjects";
import { Dispatch, SetStateAction } from "react";
import { SubjectProps } from "@components/Subject/Subject";

type VisualisationForegroundProps = {
    edgeXOffsets: EdgeOffsets,
    edgeYOffsets: EdgeOffsets,
    positions: RealPositions,
    processedSubjects: Details,
    specialization: Specialization,
    choices: Choices,
    SubjectComponent: React.ComponentType<SubjectProps>,
    setDragEnabled: Dispatch<SetStateAction<boolean>>
    orGatesPositions: Array<{x: number, y: number}>
}

function VisualisationForeground({edgeXOffsets, edgeYOffsets, 
        positions, processedSubjects, specialization, choices,
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
            {Object.values(specialization.plan).flat().map((orderSubject) => {
                const code = "code" in orderSubject ? orderSubject.code : orderSubject.choice;
                const pos = positions[code];
                if (!pos) {return null;}
                const course = processedSubjects[code];
                // if (course.name == "") { return <p key={code} style={{position: "absolute", color: "red", left: positions[code].x,
                //                 top: positions[code].y}}>{code}</p>; }
                if (course.name == "") {
                    return null;
                }

                return (
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
                );
            })}
        </div>
    );
}

export default VisualisationForeground;