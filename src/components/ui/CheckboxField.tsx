type PreferenceFieldProps = {
    children: React.ReactNode,
    checked: boolean,
    onChange: () => void;
}

function PreferenceField({children, checked, onChange} : PreferenceFieldProps) {
    return (
        <div className="field">
            <label className="preferenceFieldLabel">{children}</label>
            <input id="check" type="checkbox" checked={checked} onChange={onChange}/>
        </div>
    )
}

export default PreferenceField