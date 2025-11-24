import SemesterColumn from "@components/Visualisation/SemesterColumn";
import { Layout } from "@/consts/VisualisationParameters";
import { Details, Order } from "@/types/subjects";


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
                return (
                    <SemesterColumn 
                        index={i} 
                        semesterSubjects={processedOrder[i + 1]}
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