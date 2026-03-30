import RadioField from "@components/SideBar/RadioField";
import RangeScaler from "@components/SideBar/RangeScaler";
import { Layout, ZoomScale } from "@/consts/VisualisationParameters";
import "./styles.css";
import { useData, useSetData, useSelectedSpecialization, useSetSelectedSpecialization, useShowAdvancedMath, useSetShowAdvancedMath, useShowAdvancedBiology, useSetShowAdvancedBiology, useShowAdvancedInformatics, useSetShowAdvancedInformatics, useSetHighlightedSubjects } from "@components/providers/dataProvider";
import { useContext, useState } from "react";
import DarkModeToggle from "@components/SideBar/DarkModeToggle";
import SideBarTitle from "./SideBarTitle";
import CheckBoxField from "./CheckboxField";
import HintBox from "./HintBox";


type SidebarProps = {
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>
}



function SideBar({scale, setScale} : SidebarProps) {
    const subjectInfoData = useData();
    const selectedSpecialization = useSelectedSpecialization();
    const setSelectedSpecialization = useSetSelectedSpecialization();
    const showAdvancedMath = useShowAdvancedMath();
    const setShowAdvancedMath = useSetShowAdvancedMath();
    const showAdvancedBiology = useShowAdvancedBiology();
    const setShowAdvancedBiology = useSetShowAdvancedBiology();
    const showAdvancedInformatics = useShowAdvancedInformatics();
    const setShowAdvancedInformatics = useSetShowAdvancedInformatics();
    const setHighlightedSubjects = useSetHighlightedSubjects();

    const advancedMathCodes = [
        ...subjectInfoData.substitutions.advanced_math.removes,
        ...subjectInfoData.substitutions.advanced_math.adds.map(s => s.code)
    ];
    const advancedInfCodes = [
        ...subjectInfoData.substitutions.advanced_inf.removes,
        ...subjectInfoData.substitutions.advanced_inf.adds.map(s => s.code)
    ];
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button className="mobileToggle submitButton phoneOnly" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '☰'}
            </button>
            <input
                style={{
                    opacity: isOpen ? "0" : "0.5" 
                }}
                className="mobileZoomSlider phoneOnly"
                type="range"
                min={ZoomScale.logMin}
                max={ZoomScale.logMax}
                step="0.01"
                value={Math.log(scale)}
                onChange={(e) => setScale(Math.exp(Number(e.target.value)))}
            ></input>
            <div className={`sideBar ${isOpen ? 'open' : ''}`}
                    style={{
                        display: "flex",
                        justifyContent: "space-between"
                    }}
            >
                <div>
                    <RangeScaler scale={scale} setScale={setScale} />
                    <div style={{height: "20px"}} className="phoneOnly" />
                    <DarkModeToggle/>
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
                    <CheckBoxField checked={showAdvancedMath}
                        onChange={() => setShowAdvancedMath(!showAdvancedMath)}
                        onMouseEnter={() => setHighlightedSubjects(new Set(advancedMathCodes))}
                        onMouseLeave={() => setHighlightedSubjects(new Set())}
                        fieldType="Math"
                    >
                        {subjectInfoData.substitutions.advanced_math.nameCZ}
                    </CheckBoxField>
                    <CheckBoxField checked={showAdvancedInformatics}
                        onChange={() => setShowAdvancedInformatics(!showAdvancedInformatics)}
                        onMouseEnter={() => setHighlightedSubjects(new Set(advancedInfCodes))}
                        onMouseLeave={() => setHighlightedSubjects(new Set())}
                        fieldType="Inf"
                    >
                        {subjectInfoData.substitutions.advanced_inf.nameCZ}
                    </CheckBoxField>
                </div>
                <div>
                    <HintBox/>
                </div>
            </div>
        </>
    );
}

export default SideBar