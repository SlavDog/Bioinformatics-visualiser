import { Course } from '@/types';
import {
    useData,
    useHighlightedSubjects,
    useSelectedChoices
} from '@components/providers/dataProvider';

export function useSubjectData(code: string, course: Course) {
    const selectedChoices = useSelectedChoices();
    const subjectInfoData = useData();
    const highlightedSubjects = useHighlightedSubjects();

    const displayCode = code.replace(/-DUP-\d+$/, '');
    const link = 'https://is.muni.cz' + course.link;
    const semLimit = course.credits;
    const isChoice = course.type === 'choice';

    // Warnings
    const warnings = new Set<string>();
    if (course.unshownNeededPredecessors?.length) warnings.add('unshownPredecessors');

    // Choice logic
    let hasSubjectLimit = false;
    let actualAmount: number | undefined;
    let subjectsTotalLimit: number | undefined;
    let creditsTotalLimit: number | undefined;

    if (isChoice) {
        const choiceLimit = subjectInfoData.choices[code.replace(/-\d+$/, '')]?.type;
        if (choiceLimit) {
            [subjectsTotalLimit, creditsTotalLimit] = choiceLimit.split(':').map(Number);
            if (subjectsTotalLimit !== 0) hasSubjectLimit = true;
        }
        const selected = selectedChoices[code] ?? new Set();
        actualAmount = !hasSubjectLimit
            ? [...selected].reduce((sum, subjectCode) => {
                  const c = subjectInfoData.details[subjectCode];
                  return sum + (c?.credits ? Number(c.credits) : 0);
              }, 0)
            : selected.size;
    }

    const isChoiceWithLimit = isChoice && !code.includes('core') && !code.includes('tv');
    const creditsLabel = !hasSubjectLimit ? 'kr.' : 'předm.';
    const totalLimit = !hasSubjectLimit ? creditsTotalLimit : subjectsTotalLimit;
    const tooltipContent = `V tomto semestru vybráno: ${actualAmount} z doporučených ${semLimit} ${!hasSubjectLimit ? 'kreditů' : 'předmětů'}. Celkem za studium je nutné splnit ${totalLimit} ${creditsLabel}`;

    return {
        displayCode,
        link,
        semLimit,
        isChoice,
        hasSubjectLimit,
        actualAmount,
        subjectsTotalLimit,
        creditsTotalLimit,
        warnings,
        subjectInfoData,
        selectedChoices,
        highlightedSubjects,
        isChoiceWithLimit,
        creditsLabel,
        totalLimit,
        tooltipContent
    };
}
