import SemesterColumn from "@components/Visualisation/SemesterColumn";
import { Layout } from "@/consts/VisualisationParameters";

function VisualisationBackground({children, maxX, maxY, semesterCount, processedOrder, processedSubjects, scale}) {
    console.log(maxY);
    return (
        <div className="visualisationBackground"
            style={{
                transform: `scale(${scale})`,
                width: maxX,
                height: maxY + Layout.semesterTitleInset
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