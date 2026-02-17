type SelectFieldProps = {
    options: Array<string>,
    placeholder?: string
}


function SelectField({options, placeholder} : SelectFieldProps) {
    return (
        <div className="field">
            <select>
                <option value="" disabled selected>{placeholder}</option>
                {options.sort().map((code) => {
                    return (
                        <option key={code} value={code}>
                            {code}
                        </option>
                    );
                })}
            </select>
            <input className="submitButton" type="submit" value="Zvolit"></input>
        </div>
    );
}

export default SelectField;