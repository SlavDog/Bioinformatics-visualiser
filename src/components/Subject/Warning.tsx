import { Course } from '@/types/subjects';
import Tippy from '@tippyjs/react';

type WarningProps = {
    warnings: Set<string>;
    course: Course;
};

function Warning({ warnings, course }: WarningProps) {
    return (
        <>
            {warnings.has('isAlsoOutside') && (
                <div className="warningContainer outsideWarningContainer circle">
                    <Tippy placement="bottom" content={'Tento předmět je již ve tvém plánu.'}>
                        <p className="warningSymbol">!</p>
                    </Tippy>
                </div>
            )}
            {warnings.has('unshownPredecessors') && (
                <div className="warningContainer predsWarningContainer circle">
                    <Tippy
                        placement="bottom"
                        content={
                            'K tomuto předmětu v grafu chybí prerekvizity: ' +
                            course.unshownNeededPredecessors?.join(', ')
                        }
                    >
                        <p className="warningSymbol">!</p>
                    </Tippy>
                </div>
            )}
        </>
    );
}

export default Warning;
