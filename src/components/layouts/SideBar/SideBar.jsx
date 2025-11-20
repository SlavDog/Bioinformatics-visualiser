import CheckboxField from "@components/ui/CheckboxField";
import subjectInfoData from '@/data/final_tree.json';
import SelectField from "@components/ui/SelectField";
import TagsBox from "@components/ui/TagsBox";
import RangeScaler from "@components/ui/RangeScaler/RangeScaler";
import { Layout } from "@/consts/VisualisationParameters";
import "./SideBar.css";

function SideBar({scale, setScale}) {
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
            <SelectField options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Předměty, které nechci:</h1>
            <SelectField options={Object.keys(subjectInfoData["details"])}/>
            <h1 className="sideBarSubtitle">Aktuální filtry:</h1>
            <TagsBox/>
            <h1 className="sideBarTitle">Zaměření</h1>
            <CheckboxField>Aplikovaná bioinformatika</CheckboxField>
            <CheckboxField>Vývoj bioinformatického software</CheckboxField>
        </div>
    );
}

export default SideBar;