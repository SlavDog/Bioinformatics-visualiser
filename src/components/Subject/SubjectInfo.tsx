import { Course } from '@/types';
import SubjectSelectedLabels from './SubjectSelectedLabels';

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
                    <p className="subjectInfo">
                        {course.faculty} / {course.language} / {course.completion}
                    </p>
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
