import SemesterColumn from '@components/Visualisation/SemesterColumn';
import { Layout } from '@/consts/visualisationParameters';
import { Details, Spec } from '@/types';
import { useSelectedSpecialization } from '@components/providers/dataProvider';

type VisualisationBackgroundProps = {
    children: React.ReactNode;
    maxX: number;
    maxY: number;
    semesterCount: number;
    processedSpec: Spec;
    processedSubjects: Details;
    scale: number;
};

function VisualisationBackground({
    children,
    maxX,
    maxY,
    semesterCount,
    processedSpec,
    processedSubjects,
    scale
}: VisualisationBackgroundProps) {
    const selectedSpecialization = useSelectedSpecialization();
    const currentSpec = processedSpec[selectedSpecialization] || {};
    return (
        <div
            className="visualisationBackground"
            style={{
                transform: `scale(${scale})`,
                width: maxX * scale,
                height:
                    (maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding) * scale,
                top: Layout.paddingVertical * scale,
                left: Layout.paddingHorizontal * scale
            }}
        >
            {Array.from({ length: semesterCount }).map((_, i) => {
                const subjects = currentSpec.plan[i + 1] || [];
                return (
                    <SemesterColumn
                        key={`semester-column-${i}`}
                        index={i}
                        semesterSubjects={subjects}
                        processedSubjects={processedSubjects}
                        maxY={maxY}
                        semesterCount={semesterCount}
                    />
                );
            })}
            {children}
        </div>
    );
}

export default VisualisationBackground;
