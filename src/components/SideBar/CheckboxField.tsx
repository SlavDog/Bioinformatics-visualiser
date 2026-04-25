type CheckBoxFieldProps = {
    children: React.ReactNode;
    checked: boolean;
    onChange: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    fieldType: string;
};

function CheckBoxField({
    children,
    checked,
    onChange,
    onMouseEnter,
    onMouseLeave,
    fieldType
}: CheckBoxFieldProps) {
    return (
        <div
            className={`field advancedField advanced${fieldType}Field`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onChange}
        >
            <label className="preferenceFieldLabel">{children}</label>
            <input
                id="check"
                type="checkbox"
                checked={checked}
                readOnly
                style={{ marginTop: '5px', alignSelf: 'center' }}
            />
        </div>
    );
}
export default CheckBoxField;
