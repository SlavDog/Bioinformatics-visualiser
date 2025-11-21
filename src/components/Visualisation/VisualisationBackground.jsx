import SemesterColumn from "@components/Visualisation/SemesterColumn";
import { Layout } from "@/consts/VisualisationParameters";

function VisualisationBackground({children, maxX, maxY, semesterCount, processedOrder, processedSubjects, scale}) {
    console.log("Backround", "width", maxX * scale, "height", (maxY + Layout.semesterTitleInset) * scale)
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
                    />
                );
            })}
            {children}
        </div>
    );
}

export default VisualisationBackground;