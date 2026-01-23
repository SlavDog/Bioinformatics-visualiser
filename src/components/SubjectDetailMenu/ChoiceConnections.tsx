import { Course } from "@/types/subjects";
import { useData } from "@components/providers/dataProvider";
import ChoiceConnection from '@components/ui/ChoiceConnection';


type ChoiceConnectionsProps = {
    course: Course,
    subjectWidth: number;
    isPredecessor: boolean
}


function ChoiceConnections({course, subjectWidth, isPredecessor} : ChoiceConnectionsProps) {
    const subjectInfoData = useData();
    let subjectsList = isPredecessor ? course.predecessors : course.successors;
    let voluntarySubjectsArray = subjectsList.map(subject => subject.code).filter(code => !Object.keys(subjectInfoData["details"]).includes(code));
    let compulsorySubjectsArray = subjectsList.map(subject => subject.code).filter(code => Object.keys(subjectInfoData["details"]).includes(code));
    let voluntarySubjectsText = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré nejsou povinné: ${voluntarySubjectsArray.join(", ")}`;
    let compulsorySubjectsText = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré jsou povinné: ${compulsorySubjectsArray.join(", ")}`;
    
    let allSoft = subjectsList.every(edge => edge.by_prerequisites == false);

    let yStart = isPredecessor ? 25 : 5;
    let yEnd = isPredecessor ? 55 : 30;
    let x = subjectWidth / 4;

    let compulsoryColor = compulsorySubjectsArray.length == 0 ? "transparent" : "black";
    let voluntaryColor = voluntarySubjectsArray.length == 0 ? "transparent" : "gray";

    return (
        <div style={{display: "flex", flexDirection: "row", userSelect: "none"}}>
            <ChoiceConnection 
                color={compulsoryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                allSoft={allSoft}
                text={compulsorySubjectsText}
                subjectWidth={subjectWidth}
            />
            <ChoiceConnection 
                color={voluntaryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                allSoft={false}
                text={voluntarySubjectsText}
                subjectWidth={subjectWidth}
            />
        </div>
    )
}

export default ChoiceConnections;