import './styles.css';
import { useState } from 'react';
import SubjectDetailMenu from '@components/SubjectDetailMenu/SubjectDetailMenu';
import { Course } from '@/types/subjects';
import Warning from '@components/Subject/Warning';
import BioIcon from '@/assets/bio.svg';
import InfIcon from '@/assets/inf.svg';
import MathIcon from '@/assets/math.svg';
import ChoiceIcon from '@/assets/choice.svg';
import OtherIcon from '@/assets/other.svg';
import { typeCodeToName } from '@utils/textHelpers';
import {
    useData,
    useHighlightedSubjects,
    useSelectedChoices
} from '@components/providers/dataProvider';
import Tippy from '@tippyjs/react';

export type SubjectProps = {
    code: string;
    course: Course;
    isAlsoOutside: boolean;
    style: React.CSSProperties;
    setDragEnabled: (b: boolean) => void;
};

const typeToColor: Record<string, string> = {
    IN: 'var(--informatics)',
    BI: 'var(--biology)',
    MA: 'var(--math)',
    choice: 'var(--choice)'
};

function Subject({ code, course, isAlsoOutside = false, style, setDragEnabled }: SubjectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const highlightedSubjects = useHighlightedSubjects();
    const selectedChoices = useSelectedChoices();
    const subjectInfoData = useData();

    const isHighlighted = highlightedSubjects.size > 0 && highlightedSubjects.has(code);
    const isDimmed = highlightedSubjects.size > 0 && !highlightedSubjects.has(code);

    const link = 'https://is.muni.cz' + course.link;
    const displayCode = code.replace(/-DUP-\d+$/, '');

    let Info = (
        <>
            <p className="subjectCode">{displayCode}</p>
            <a className="subjectName" draggable="false" href={link} target="_blank">
                {course.name}
            </a>
            <p className="subjectInfo">
                {course.faculty} / {course.language} / {course.completion}
            </p>
        </>
    );
    let onClick = () => {};
    let detailMenuSourceName = '';
    if (course.type == 'choice') {
        Info = (
            <>
                <p className="subjectCode">Předměty ze sekce:</p>
                <p className="subjectName">{course.name}</p>
            </>
        );
        onClick = () => {
            setIsOpen(true);
            setDragEnabled(false);
        };
        detailMenuSourceName = code;
    }

    let warnings: Set<string> = new Set();
    if (isAlsoOutside) {
        warnings.add('isAlsoOutside');
        console.warn(
            `This subject ${code} is also present outside of choices, which may cause issues with layout and connections.`
        );
    }
    if (
        course.unshownNeededPredecessors != undefined &&
        course.unshownNeededPredecessors.length != 0
    ) {
        warnings.add('unshownPredecessors');
    }

    const WarningComponent = <Warning warnings={warnings} course={course} />;

    const selectedCodes =
        course.type === 'choice' ? [...(selectedChoices[code] ?? [])].slice(0, 2) : [];
    let limit = course.credits;
    let hasSubjectLimit = false;
    if (course.type === 'choice') {
        const choiceLimit = subjectInfoData.choices[code.replace(/-\d+$/, '')]?.type;
        console.log(code, choiceLimit);
        if (choiceLimit) {
            const [subjectsLimit, _] = choiceLimit.split(':').map(Number);
            if (subjectsLimit != 0) {
                hasSubjectLimit = true;
            }
        }
    }
    return (
        <>
            <div
                onClick={onClick}
                className={`subject subjectType${course.type} ${isHighlighted ? 'subjectHighlighted' : ''} ${isDimmed ? 'subjectDimmed' : ''}`}
                style={style}
            >
                <div className="topSubjectContainer">
                    {Info}
                    {course.type === 'choice' && selectedCodes.length > 0 && (
                        <div className="subjectSelectedLabels">
                            {selectedCodes.map((selectedCode, i) => {
                                const type = subjectInfoData.details[selectedCode]?.type;
                                return (
                                    <p
                                        key={selectedCode}
                                        className={`subjectSelectedLabel`}
                                        style={{
                                            color: typeToColor[type] ?? 'var(--text-secondary)'
                                        }}
                                    >
                                        {selectedCode}
                                    </p>
                                );
                            })}
                            {selectedChoices[code].size > 2 && (
                                <p
                                    className={`subjectSelectedLabel`}
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    +{selectedChoices[code].size - 2}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="bottomSubjectContainer">
                    <div className="iconContainer">
                        <Tippy placement="bottom" content={typeCodeToName(course.type)}>
                            <img
                                src={
                                    course.type === 'IN'
                                        ? InfIcon
                                        : course.type === 'BI'
                                          ? BioIcon
                                          : course.type === 'MA'
                                            ? MathIcon
                                            : course.type === 'choice'
                                              ? ChoiceIcon
                                              : OtherIcon
                                }
                                draggable="false"
                                className="circle"
                            />
                        </Tippy>
                        {WarningComponent}
                    </div>

                    <p className="subjectCredits">
                        {limit} {!hasSubjectLimit ? 'kr.' : 'předm.'}
                    </p>
                </div>
            </div>
            <SubjectDetailMenu
                open={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setDragEnabled(true);
                }}
                source={detailMenuSourceName}
                setIsOpen={setIsOpen}
                credits={limit}
            />
        </>
    );
}

export default Subject;
