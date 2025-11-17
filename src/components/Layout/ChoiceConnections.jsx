import subjectInfoData from '@/data/final_tree.json'
import ChoiceConnection from '@components/ui/ChoiceConnection';

function ChoiceConnections({course, subjectWidth, isPredecessor}) {
    let subjectsList = isPredecessor ? course.predecessors : course.successors;
    let voluntarySubjectsArray = subjectsList.map(subject => subject.code).filter(code => !Object.keys(subjectInfoData["details"]).includes(code));
    let compulsorySubjectsArray = subjectsList.map(subject => subject.code).filter(code => Object.keys(subjectInfoData["details"]).includes(code));
    let voluntarySubjectsText = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré nejsou povinné: ${voluntarySubjectsArray.join(", ")}`;
    let compulsorySubjectsText = `${isPredecessor ? "Je následníkem" : "Je předchůdcem"} některých předmětů,\nkteré jsou povinné: ${compulsorySubjectsArray.join(", ")}`;

    let yStart = isPredecessor ? 25 : 5;
    let yEnd = isPredecessor ? 55 : 30;
    let x = subjectWidth / 4;

    let compulsoryColor = compulsorySubjectsArray.length == 0 ? "transparent" : "black";
    let voluntaryColor = voluntarySubjectsArray.length == 0 ? "transparent" : "gray";

    return (
        <div style={{display: "flex", flexDirection: "row"}}>
            <ChoiceConnection 
                color={compulsoryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                text={compulsorySubjectsText}
                subjectWidth={subjectWidth}
            />
            <ChoiceConnection 
                color={voluntaryColor}
                x={x}
                yStart={yStart}
                yEnd={yEnd}
                isPredecessor={isPredecessor}
                text={voluntarySubjectsText}
                subjectWidth={subjectWidth}
            />
        </div>
    )
}

export default ChoiceConnections;