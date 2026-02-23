export type Course = {
    name: string,
    faculty: string,
    successors: Array<Edge>,
    language: string,
    predecessors: Array<Edge>,
    completion: string,
    credits: number
    link: string,
    type: string,
    unshownNeededPredecessors?: string[];
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
    credits?: number
}

export type Specialization = {
  nameCZ: string;
  nameEN: string;
  descCZ: string;
  descEN: string;
  base: Array<OrderSubject>;
  plan: Record<string, Array<OrderSubject>>;
};

export type Spec = Record<string, Specialization>;

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
    spec: Spec,
    choices: Choices,
    substitutions: Substitutions
}

export type Substitutions = Record<string, Substitution>
type Substitution = {
    nameCZ: string,
    removes: Array<string>,
    adds: Array<{code: string, semester: number}>
}

export type EdgeOffsets = Record<string, number>;

export type Coordinates = {x: number, y: number};
export type RealCoordinates = {x: number, y: number};
export type CodeToCoordinates = Record<string, Coordinates>;
export type PositionsToCode = Array<Array<string>>;
export type RealPositions = Record<string, RealCoordinates>;

export type AdvancedSwitch = {
    advanced_math: boolean,
    advanced_inf: boolean,
    advanced_bi: boolean
}