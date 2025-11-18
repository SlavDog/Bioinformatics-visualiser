function SelectField({options}) {
    return (
        <div className="field">
            <select>
                <option value="" disabled selected>Vyberte předmět</option>
                {options.sort().map((code) => {
                    return (
                        <option key={code} value={code}>
                            {code}
                        </option>
                    );
                })}
            </select>
            <input className="submitButton" type="submit" value="Submit"></input>
        </div>
    );
}

export default SelectField;