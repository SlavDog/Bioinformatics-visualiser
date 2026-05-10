export function getChoiceLimitText(choiceLimit: string, credits: number): string {
    const [subjectLimit, creditsLimit] = choiceLimit.split(':').map(Number);
    let limitText = `V tomto semestru si doporučujeme zapsat ${credits} kr. z celkově potřebných ${creditsLimit} kr. z následujícího výběru:`;
    if (subjectLimit != 0) {
        let subjectDeclination =
            credits == 1 ? 'předmět' : credits >= 2 && credits < 5 ? 'předměty' : 'předmětů';
        let sentenceEnd =
            subjectLimit > 1
                ? `z ${subjectLimit} předmětů celkově potřebných z následujícího výběru:`
                : 'z následujícího výběru:';
        limitText = `V tomto semestru si doporučujeme zapsat ${credits} ${subjectDeclination} ${sentenceEnd}`;
    }
    return limitText;
}

export function typeCodeToName(typeCode: string): string {
    switch (typeCode) {
        case 'IN':
            return 'Informatika';
        case 'BI':
            return 'Biologie';
        case 'MA':
            return 'Matematika';
        case 'choice':
            return 'Povinně volitelný blok';
        default:
            return 'Ostatní';
    }
}

export function facultyCodeToName(facultyCode: string): string {
    switch (facultyCode) {
        case 'FI':
            return 'Fakulta informatiky';
        case 'PřF':
            return 'Přírodovědecká fakulta';
        case 'PrF':
            return 'Právnická fakulta';
        case 'LF':
            return 'Lékařská fakulta';
        case 'FF':
            return 'Filozofická fakulta';
        case 'PdF':
            return 'Pedagogická fakulta';
        case 'FaF':
            return 'Farmaceutická fakulta';
        case 'ESF':
            return 'Ekonomicko-správní fakulta';
        case 'FSS':
            return 'Fakulta sociálních studií';
        case 'FSpS':
            return 'Fakulta sportovních studií';
        default:
            return facultyCode;
    }
}

export function courseEndingToText(completion: string): string {
    switch (completion) {
        case 'zk':
            return 'zkouška';
        case 'z':
            return 'zápočet';
        case 'k':
            return 'kolokvium';
        default:
            return completion;
    }
}

export function languageCodeToName(languageCode: string): string {
    switch (languageCode) {
        case 'CZE':
            return 'čeština';
        case 'ENG':
            return 'angličtina';
        default:
            return languageCode;
    }
}
