import './styles.css';
import { useState } from 'react';
import SubjectDetailMenu from '@components/SubjectDetailMenu/SubjectDetailMenu';
import { Course } from '@/types';
import Warning from '@components/Subject/Warning';
import BioIcon from '@/assets/bio.svg';
import InfIcon from '@/assets/inf.svg';
import MathIcon from '@/assets/math.svg';
import ChoiceIcon from '@/assets/choice.svg';
import OtherIcon from '@/assets/other.svg';
import { typeCodeToName } from '@utils/textHelpers';
import { useSetHighlightedSubjects } from '@components/providers/dataProvider';
import Tippy from '@tippyjs/react';
import { useSubjectData } from '@/hooks/useSubjectData';
import SubjectCredits from './SubjectCredits';
import SubjectInfo from './SubjectInfo';

const typeToColor: Record<string, string> = {
    IN: 'var(--informatics)',
    BI: 'var(--biology)',
    MA: 'var(--math)',
    choice: 'var(--choice)'
};

const typeToIcon: Record<string, string> = {
    IN: InfIcon,
    BI: BioIcon,
    MA: MathIcon,
    choice: ChoiceIcon
};

export type SubjectProps = {
    code: string;
    course: Course;
    isAlsoOutside?: boolean;
    dim?: boolean;
    style: React.CSSProperties;
    setDragEnabled: (b: boolean) => void;
};

function Subject({
    code,
    course,
    isAlsoOutside = false,
    dim = true,
    style,
    setDragEnabled
}: SubjectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const setHighlightedSubjects = useSetHighlightedSubjects();

    const {
        displayCode,
        link,
        semLimit,
        isChoice,
        actualAmount,
        warnings,
        subjectInfoData,
        selectedChoices,
        highlightedSubjects,
        isChoiceWithLimit,
        creditsLabel,
        tooltipContent
    } = useSubjectData(code, course);

    if (isAlsoOutside) warnings.add('isAlsoOutside');

    const isHighlighted = highlightedSubjects.size > 0 && highlightedSubjects.has(code);
    const isDimmed = dim && highlightedSubjects.size > 0 && !highlightedSubjects.has(code);
    const onClick = isChoice
        ? () => {
              setIsOpen(true);
              setDragEnabled(false);
          }
        : () => {};

    const selectedCodes = isChoice ? [...(selectedChoices[code] ?? [])].slice(0, 2) : [];

    return (
        <>
            <div
                onClick={onClick}
                className={`subject subjectType${course.type} ${isHighlighted ? 'subjectHighlighted' : ''} ${isDimmed ? 'subjectDimmed' : ''}`}
                style={style}
            >
                <SubjectInfo
                    course={course}
                    displayCode={displayCode}
                    link={link}
                    isChoice={isChoice}
                    selectedCodes={selectedCodes}
                    totalSelected={selectedChoices[code]?.size ?? 0}
                    typeToColor={typeToColor}
                    getType={(c) => subjectInfoData.details[c]?.type}
                />
                <div className="bottomSubjectContainer">
                    <div className="iconContainer">
                        <Tippy placement="bottom" content={typeCodeToName(course.type)}>
                            <img
                                src={typeToIcon[course.type] ?? OtherIcon}
                                draggable="false"
                                className="circle"
                            />
                        </Tippy>
                        <Warning warnings={warnings} course={course} />
                    </div>
                    <SubjectCredits
                        isChoiceWithLimit={isChoiceWithLimit}
                        actualAmount={actualAmount}
                        semLimit={semLimit}
                        creditsLabel={creditsLabel}
                        tooltipContent={tooltipContent}
                        className="subjectCredits"
                    />
                </div>
            </div>
            <SubjectDetailMenu
                open={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setDragEnabled(true);
                    setHighlightedSubjects(new Set());
                }}
                source={isChoice ? code : ''}
                setIsOpen={setIsOpen}
                credits={semLimit}
            />
        </>
    );
}

export default Subject;
