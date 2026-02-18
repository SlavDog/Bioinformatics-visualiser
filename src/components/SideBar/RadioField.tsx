type RadioFieldProps = {
    children: React.ReactNode,
    checked: boolean,
    onChange: () => void;
}

function RadioField({children, checked, onChange} : RadioFieldProps) {
    return (
        <div className="field">
            <label className="preferenceFieldLabel">{children}</label>
            <input id="check" type="radio" checked={checked} onChange={onChange}/>
        </div>
    )
}

export default RadioField