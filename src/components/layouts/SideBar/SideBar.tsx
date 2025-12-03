import CheckboxField from "@components/ui/CheckboxField";
import SelectField from "@components/ui/SelectField";
import TagsBox from "@components/ui/TagsBox";
import RangeScaler from "@components/ui/RangeScaler/RangeScaler";
import { Layout } from "@/consts/VisualisationParameters";
import "./styles.css";
import { useData, useSetData } from "@components/providers/dataProvider";
import { useContext, useState } from "react";


type SidebarProps = {
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>
}



function SideBar({scale, setScale} : SidebarProps) {
    const subjectInfoData = useData();
    const setData = useSetData();
    const [code, setCode] = useState("");
    const [semester, setSemester] = useState(1);
    

    const sendToBackend = async () => {
        const res = await fetch("http://localhost:8000/run-script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: code,
                semester: semester
            })
        });

        const newValue = await res.json();
        setData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [code]: newValue,
            },
            order: {
                ...prev.order,
                [semester]: [
                    ...prev.order[semester],
                    {code: code}
                ]
            }
        }));
    }

    return (
        <div className="sideBar"
                style={{
                   width: `${Layout.sidebarWidth}px` 
                }}>
            <RangeScaler scale={scale} setScale={setScale} />
            <h1 className="sideBarTitle">Preferovaná oblast</h1>
            <CheckboxField>Preferuji informatiku</CheckboxField>
            <CheckboxField>Preferuji matematiku</CheckboxField>
            <CheckboxField>Preferuji biologii</CheckboxField>
            <h1 className="sideBarSubtitle">Předměty, které chci:</h1>
            <SelectField placeholder="Vyberte předmět" options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Předměty, které nechci:</h1>
            <SelectField placeholder="Vyberte předmět" options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Aktuální filtry:</h1>
            <TagsBox/>
            <h1 className="sideBarTitle">Zaměření</h1>
            <CheckboxField>Aplikovaná bioinformatika</CheckboxField>
            <CheckboxField>Vývoj bioinformatického software</CheckboxField>
            <input type="text" className="sideBarInput" placeholder="Zadejte kód" value={code} onChange={(e) => setCode(e.target.value)} />
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                {["1", "2", "3", "4", "5", "6"].map((number) => {
                    return (
                        <option key={number} value={number}>
                            {number}
                        </option>
                    );
                })}
            </select>
            <button disabled={code === ""} className="sideBarButton" onClick={sendToBackend}>Přidat předmět</button>
        </div>
    );
}

export default SideBar;