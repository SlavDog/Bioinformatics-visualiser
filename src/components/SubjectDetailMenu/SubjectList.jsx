import SubjectListItem from "@components/SubjectDetailMenu/SubjectListItem";
import subjectInfoData from '@/data/final_tree.json';
import BigButton from "@components/ui/BigButton";

function SubjectList({source}) {
    const choice = subjectInfoData["choices"][source];
    if (source == "tv") { 
        return <BigButton color={"#b400d8"} onClick={() => window.open('https://www.fsps.muni.cz/cus/vyuka/predmety-povinne-telesne-vychovy', '_blank')} text="Zobrazit aktuální nabídku tělocviků!"></BigButton>
    }
    if (source=="CORE") {
        return <button onClick={() => window.open('https://www.muni.cz/studenti/kazdodenni-studium/spolecny-univerzitni-zaklad/co-jsou-core-predmety', '_blank')} className='zoomButton'>Zobrazit aktuální nabídku CORE předmětů 🎓</button>
    }
    return (
        <div className="menuBoxSubjectsContainer">
            {Object.values(choice["list"]).map((code) => {
                let course = subjectInfoData["details"][code];
                return <SubjectListItem code={code} course={course}/>
            })}
        </div>
    )
}

export default SubjectList