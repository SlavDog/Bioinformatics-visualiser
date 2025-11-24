type PreferenceFieldProps = {
    children: React.ReactNode
}

function PreferenceField({children} : PreferenceFieldProps) {
    return (
        <div className="field">
            <label className="preferenceFieldLabel">{children}</label>
            <input id="check" type="checkbox"/>
        </div>
    )
}

export default PreferenceField