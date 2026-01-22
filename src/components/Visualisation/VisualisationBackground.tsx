import SemesterColumn from "@components/Visualisation/SemesterColumn";
import { Layout } from "@/consts/VisualisationParameters";
import { Details, Order } from "@/types/subjects";
import { useSelectedSpecialization } from "@components/providers/dataProvider";


type VisualisationBackgroundProps = {
    children: React.ReactNode,
    maxX: number,
    maxY: number,
    semesterCount: number,
    processedOrder: Order,
    processedSubjects: Details,
    scale: number
}


function VisualisationBackground({children, maxX, maxY, semesterCount, processedOrder, processedSubjects, scale} : VisualisationBackgroundProps) {
    const selectedSpecialization = useSelectedSpecialization();
    const currentSpecOrder = processedOrder[selectedSpecialization] || {};
    return (
        <div className="visualisationBackground"
            style={{
                transform: `scale(${scale})`,
                width: maxX * scale,
                height: (maxY + Layout.semesterTitleInset + Layout.semesterColumnBottomPadding) * scale,
                top: Layout.paddingVertical * scale,
                left: Layout.paddingHorizontal * scale
            }}
        >
            {Array.from({ length: semesterCount }).map((_, i) => {
                const subjects = currentSpecOrder[i + 1] || [];
                return (
                    <SemesterColumn 
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