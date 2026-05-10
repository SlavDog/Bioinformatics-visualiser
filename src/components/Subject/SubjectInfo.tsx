import { Course } from '@/types';
import SubjectSelectedLabels from './SubjectSelectedLabels';
import Tippy from '@tippyjs/react';
import { courseEndingToText, facultyCodeToName, languageCodeToName } from '@utils/textHelpers';

type SubjectInfoProps = {
    course: Course;
    displayCode: string;
    link: string;
    isChoice: boolean;
    selectedCodes: string[];
    totalSelected: number;
    typeToColor: Record<string, string>;
    getType: (code: string) => string | undefined;
};

function SubjectInfo({
    course,
    displayCode,
    link,
    isChoice,
    selectedCodes,
    totalSelected,
    typeToColor,
    getType
}: SubjectInfoProps) {
    return (
        <div className="topSubjectContainer">
            {isChoice ? (
                <>
                    <p className="subjectCode">Předměty ze sekce:</p>
                    <p className="subjectName">{course.name}</p>
                </>
            ) : (
                <>
                    <p className="subjectCode">{displayCode}</p>
                    <a className="subjectName" draggable="false" href={link} target="_blank">
                        {course.name}
                    </a>
                    <Tippy
                        placement="bottom"
                        content={`${facultyCodeToName(course.faculty)} / ${languageCodeToName(course.language)} / ${courseEndingToText(course.completion)}`}
                    >
                        <p className="subjectInfo" style={{ width: 'fit-content' }}>
                            {course.faculty} / {course.language} / {course.completion}
                        </p>
                    </Tippy>
                </>
            )}
            <SubjectSelectedLabels
                selectedCodes={selectedCodes}
                totalSelected={totalSelected}
                typeToColor={typeToColor}
                getType={getType}
            />
        </div>
    );
}

export default SubjectInfo;
