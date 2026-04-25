type SubjectSelectedLabelsProps = {
    selectedCodes: string[];
    totalSelected: number;
    typeToColor: Record<string, string>;
    getType: (code: string) => string | undefined;
};

function SubjectSelectedLabels({
    selectedCodes,
    totalSelected,
    typeToColor,
    getType
}: SubjectSelectedLabelsProps) {
    if (selectedCodes.length === 0) return null;

    return (
        <div className="subjectSelectedLabels">
            {selectedCodes.map((selectedCode) => (
                <p
                    key={selectedCode}
                    className="subjectSelectedLabel"
                    style={{
                        color: typeToColor[getType(selectedCode) ?? ''] ?? 'var(--text-secondary)'
                    }}
                >
                    {selectedCode}
                </p>
            ))}
            {totalSelected > 2 && (
                <p className="subjectSelectedLabel" style={{ color: 'var(--text-secondary)' }}>
                    +{totalSelected - 2}
                </p>
            )}
        </div>
    );
}

export default SubjectSelectedLabels;
