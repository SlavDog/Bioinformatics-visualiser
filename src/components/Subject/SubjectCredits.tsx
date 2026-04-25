import Tippy from '@tippyjs/react';

type SubjectCreditsProps = {
    isChoiceWithLimit: boolean;
    actualAmount: number | undefined;
    semLimit: number;
    creditsLabel: string;
    tooltipContent: string;
    className: string;
};

function SubjectCredits({
    isChoiceWithLimit,
    actualAmount,
    semLimit,
    creditsLabel,
    tooltipContent,
    className
}: SubjectCreditsProps) {
    if (isChoiceWithLimit) {
        return (
            <Tippy placement="bottom" content={tooltipContent}>
                <p className={className}>
                    {actualAmount} / {semLimit} {creditsLabel}
                </p>
            </Tippy>
        );
    }

    return <p className={className}>{semLimit} kr.</p>;
}

export default SubjectCredits;
