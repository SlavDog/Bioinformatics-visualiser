export function getChoiceLimitText(choiceLimit, credits) {
    const [subjectLimit, creditsLimit] = choiceLimit.split(":").map(Number);
    let limitText = `V tomto semestru si doporučujeme zapsat ${credits} kr. z celkově potřebných ${creditsLimit} kr. z následujícího výběru:`
    if (subjectLimit != 0) {
        let subjectDeclination = credits == 1 ? "předmět" : (credits >= 2 && credits < 5 ? "předměty" : "předmětů")
        let sentenceEnd = subjectLimit > 1 ? `z ${subjectLimit} předmětů celkově potřebných z následujícího výběru:` : "z následujícího výběru:"
        limitText = `V tomto semestru si doporučujeme zapsat ${credits} ${subjectDeclination} ${sentenceEnd}`
    }
    return limitText;
}