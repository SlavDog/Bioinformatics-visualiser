import { Course } from "@/types/subjects";

type WarningProps = {
    warnings: Set<string>,
    course: Course
}

function Warning({warnings, course}: WarningProps) {
        return (
            <>
                {warnings.has("isAlsoOutside") && <div className="warningContainer outsideWarningContainer circle"
                    title="Tento předmět je již ve tvém plánu.">
                    <p className="warningSymbol">!</p>
                </div>}
                {warnings.has("unshownPredecessors") && <div className="warningContainer predsWarningContainer circle"
                    title={"K tomuto předmětu v grafu chybí prerekvizity: " + course.unshownNeededPredecessors?.join(", ")}>
                    <p className="warningSymbol">!</p>
                </div>}
            </>
        );
}

export default Warning;