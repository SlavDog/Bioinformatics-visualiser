import Connections from '@components/Visualisation/Connections';
import { Layout } from '@/consts/visualisationParameters';
import OrGates from '@components/Visualisation/OrGates';
import { Details, EdgeOffsets, CodeToPosition, Specialization } from '@/types';
import { Dispatch, SetStateAction } from 'react';
import { SubjectProps } from '@components/Subject/Subject';

type VisualisationForegroundProps = {
    edgeXOffsets: EdgeOffsets;
    edgeYOffsets: EdgeOffsets;
    positions: CodeToPosition;
    processedSubjects: Details;
    specialization: Specialization;
    SubjectComponent: React.ComponentType<SubjectProps>;
    setDragEnabled: Dispatch<SetStateAction<boolean>>;
    orGatesPositions: Array<{ x: number; y: number }>;
};

function VisualisationForeground({
    edgeXOffsets,
    edgeYOffsets,
    positions,
    processedSubjects,
    specialization,
    SubjectComponent,
    setDragEnabled,
    orGatesPositions
}: VisualisationForegroundProps) {
    return (
        <div
            className="visualisationForeground"
            style={{
                inset: `${Layout.semesterTitleInset}px 0 0 0`
            }}
        >
            <Connections
                processedSubjects={processedSubjects}
                positions={positions}
                xOffsets={edgeXOffsets}
                yOffsets={edgeYOffsets}
            />
            <OrGates orGatesPositions={orGatesPositions} />
            {Object.values(specialization.plan)
                .flat()
                .map((orderSubject) => {
                    const code = 'code' in orderSubject ? orderSubject.code : orderSubject.choice;
                    const pos = positions[code];
                    if (!pos) {
                        return null;
                    }
                    const course = processedSubjects[code];
                    if (course.name == '') {
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
                                position: 'absolute',
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
