import SubjectListItem from "./SubjectListItem";
import subjectInfoData from '../../data/final_tree.json';

function SubjectList({source}) {
    const choice = subjectInfoData["choices"][source];
    if (source == "tv") { 
        return <button onClick={() => window.open('https://www.fsps.muni.cz/cus/vyuka/predmety-povinne-telesne-vychovy', '_blank')} className='zoomButton'>Zobrazit aktuální nabídku tělocviků 👟</button>
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