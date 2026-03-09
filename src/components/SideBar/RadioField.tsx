type RadioFieldProps = {
    children: React.ReactNode,
    checked: boolean,
    onChange: () => void;
}

function RadioField({children, checked, onChange} : RadioFieldProps) {
    return (
        <div className="field" onClick={onChange}>
            <label className="preferenceFieldLabel">{children}</label>
            <input id="check" type="radio" checked={checked}/>
        </div>
    )
}

export default RadioField