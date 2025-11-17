import SemesterColumn from "@components/Visualisation/SemesterColumn";

function VisualisationBackground({children, maxX, maxY, semesterCount, subjectInfoData, processedSubjects, scale}) {
    return (
        <div className="visualisationBackground"
            style={{
                transform: `scale(${scale})`,
                width: maxX + 40,
                height: maxY,
            }}
        >
            {Array.from({ length: semesterCount }).map((_, i) => {
                return (
                    <SemesterColumn 
                        index={i} 
                        semesterSubjects={subjectInfoData["order"][i + 1]}
                        subjectInfoData={processedSubjects}
                        maxY={maxY}
                    />
                );
            })}
            {children}
        </div>
    );
}

export default VisualisationBackground;