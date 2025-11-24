export type Course = {
    name: string,
    faculty: string,
    successors: Array<Edge>,
    language: string,
    predecessors: Array<Edge>,
    completion: string,
    credits: number
    link: string,
    semester: number | null,
    type: string,
    subjects?: Array<Course>
}

export type Edge = {
    code: string,
    groups: Array<Array<string>>,
    by_prerequisites: boolean
}

export type Details = Record<string, Course>;

export type OrderSubject = {
    code: string
} | {
    choice: string,
    credits: number
}

export type Order = Record<string, Array<OrderSubject>>;

export type ChoiceSubject = {
    code: string,
    nazevCZ: string,
    nazevEN: string,
    credits: number
} | string

export type Choice = {
    type: string,
    list: Array<ChoiceSubject>
    refnCZ: string,
    refnEN: string,
    credits?: number
}
export type Choices = Record<string, Choice>;

export type SubjectData = {
    details: Details,
    order: Order,
    choices: Choices,
}

export type EdgeOffsets = Record<string, number>;

export type Coordinates = [number, number];
export type RealCoordinates = {x: number, y: number};
export type CodeToCoordinates = Record<string, Coordinates>;
export type PositionsToCode = Array<Array<string>>;
export type RealPositions = Record<string, RealCoordinates>;