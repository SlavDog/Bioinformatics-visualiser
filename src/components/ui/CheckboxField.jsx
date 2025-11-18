function PreferenceField({children}) {
    return (
        <div className="field">
            <label for="check" className="preferenceFieldLabel">{children}</label>
            <input id="check" type="checkbox"/>
        </div>
    )
}

export default PreferenceField