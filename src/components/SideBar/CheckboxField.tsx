type CheckBoxFieldProps = {
    children: React.ReactNode,
    checked: boolean,
    onChange: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}
function CheckBoxField({children, checked, onChange, onMouseEnter, onMouseLeave} : CheckBoxFieldProps) {
    return (
        <div className="field advancedMathField" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onChange}>
            <label className="preferenceFieldLabel">{children}</label>
            <input id="check" type="checkbox" checked={checked} style={{ marginTop: "5px", alignSelf: "center" }}/>
        </div>
    )
}
export default CheckBoxField