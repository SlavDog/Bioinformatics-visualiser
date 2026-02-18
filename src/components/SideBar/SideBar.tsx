import RadioField from "@components/SideBar/RadioField";
import TagsBox from "@components/SideBar/TagsBox";
import RangeScaler from "@components/SideBar/RangeScaler";
import { Layout } from "@/consts/VisualisationParameters";
import "./styles.css";
import { useData, useSetData, useSelectedSpecialization, useSetSelectedSpecialization } from "@components/providers/dataProvider";
import { useContext, useState } from "react";
import DarkModeToggle from "@components/SideBar/DarkModeToggle";
import SideBarTitle from "./SideBarTitle";
import CheckBoxField from "./CheckboxField";


type SidebarProps = {
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>
}



function SideBar({scale, setScale} : SidebarProps) {
    const subjectInfoData = useData();
    const selectedSpecialization = useSelectedSpecialization();
    const setSelectedSpecialization = useSetSelectedSpecialization();
    const setData = useSetData();
    const [code, setCode] = useState("");
    const [semester, setSemester] = useState(1);
    

    // const sendToBackend = async () => {
    //     const res = await fetch("http://localhost:8000/run-script", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //             code: code,
    //             semester: semester
    //         })
    //     });

    //     const newValue = await res.json();
    //     setData(prev => ({
    //         ...prev,
    //         details: {
    //             ...prev.details,
    //             [code]: newValue,
    //         },
    //         order: {
    //             ...prev.order,
    //             [selectedSpecialization]: {
    //                 ...prev.order[selectedSpecialization],
    //                 [semester]: [
    //                     ...prev.order[selectedSpecialization][semester],
    //                     {code: code}
    //                 ]
    //             }
    //         }
    //     }));
    // }

    return (
        <div className="sideBar"
                style={{
                   width: `${Layout.sidebarWidth}px` 
                }}>
            <RangeScaler scale={scale} setScale={setScale} />
            <DarkModeToggle/>
            {/* <SideBarTitle>Preferovaná oblast</SideBarTitle>
            <h1 className="sideBarSubtitle">Předměty, které chci:</h1>
            <SelectField placeholder="Vyberte předmět" options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Předměty, které nechci:</h1>
            <SelectField placeholder="Vyberte předmět" options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Aktuální filtry:</h1>
            <TagsBox/> */}
            <SideBarTitle>Zaměření</SideBarTitle>
            {Object.entries(subjectInfoData.spec).map(([specCode, spec]) => {
                return (
                    <RadioField key={specCode} checked={selectedSpecialization === specCode} 
                        onChange={() => setSelectedSpecialization(specCode)}>
                        {spec.nameCZ}
                    </RadioField>
                );
            })}
            <SideBarTitle tooltip="Studenti toužící po hlubším studiu některých z oblastí bioinformatiky si mohou zvolit průchod s pokročilejšími (nepovinnými) kurzy.">Pokročilejší kurzy</SideBarTitle>
            <CheckBoxField checked={true} onChange={() => {}}>Pokročilejší matematika</CheckBoxField>
            <CheckBoxField checked={true} onChange={() => {}}>Pokročilejší biologie</CheckBoxField>
            <CheckBoxField checked={true} onChange={() => {}}>Pokročilejší informatika</CheckBoxField>
            {/* <input type="text" className="sideBarInput" placeholder="Zadejte kód" value={code} onChange={(e) => setCode(e.target.value)} />
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                {["1", "2", "3", "4", "5", "6"].map((number) => {
                    return (
                        <option key={number} value={number}>
                            {number}
                        </option>
                    );
                })}
            </select>
            <button disabled={code === ""} className="sideBarButton" onClick={sendToBackend}>Přidat předmět</button> */}
        </div>
    );
}

export default SideBar