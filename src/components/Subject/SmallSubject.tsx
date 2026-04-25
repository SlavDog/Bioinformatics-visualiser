import { Course } from '@/types';
import './styles.css';
import SubjectDetailMenu from '@components/SubjectDetailMenu/SubjectDetailMenu';
import { useState } from 'react';
import { useSetHighlightedSubjects } from '@components/providers/dataProvider';
import Warning from '@components/Subject/Warning';
import { useSubjectData } from '@/hooks/useSubjectData';
import SubjectCredits from './SubjectCredits';

type SmallSubjectProps = {
    code: string;
    course: Course;
    style: React.CSSProperties;
    setDragEnabled: (b: boolean) => void;
};

function SmallSubject({ code, course, style, setDragEnabled }: SmallSubjectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const setHighlightedSubjects = useSetHighlightedSubjects();

    const {
        displayCode,
        link,
        semLimit,
        isChoice,
        warnings,
        isChoiceWithLimit,
        creditsLabel,
        actualAmount,
        tooltipContent,
        highlightedSubjects
    } = useSubjectData(code, course);

    const isHighlighted = highlightedSubjects.size > 0 && highlightedSubjects.has(code);
    const isDimmed = highlightedSubjects.size > 0 && !highlightedSubjects.has(code);

    const onClick = isChoice
        ? () => {
              setIsOpen(true);
              setDragEnabled(false);
          }
        : () => {};

    return (
        <>
            <div
                onClick={onClick}
                className={`subject subjectType${course.type} ${isHighlighted ? 'subjectHighlighted' : ''} ${isDimmed ? 'subjectDimmed' : ''}`}
                style={{ ...style, borderRadius: '0px', borderWidth: '4px' }}
            >
                <div className="smallTopSubjectContainer">
                    {isChoice ? (
                        <a className="smallSubjectCode">{code}</a>
                    ) : (
                        <a className="smallSubjectCode" draggable="false" href={link}>
                            {displayCode}
                        </a>
                    )}
                </div>
                <div className="divider" />
                <div className="smallBottomSubjectContainer">
                    <SubjectCredits
                        isChoiceWithLimit={isChoiceWithLimit}
                        actualAmount={actualAmount}
                        semLimit={semLimit}
                        creditsLabel={creditsLabel}
                        tooltipContent={tooltipContent}
                        className="smallSubjectCredits"
                    />
                    <Warning warnings={warnings} course={course} />
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

export default SmallSubject;
