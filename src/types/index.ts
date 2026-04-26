export type Course = {
    name: string;
    faculty: string;
    successors: Edge[];
    language: string;
    predecessors: Edge[];
    completion: string;
    credits: number;
    link: string;
    type: string;
    unshownNeededPredecessors?: string[];
};

export type Edge = {
    code: string;
    groups: string[][];
    by_prerequisites: boolean;
};

export type Details = Record<string, Course>;

export type OrderSubject =
    | {
          code: string;
      }
    | {
          choice: string;
          credits?: number;
      };

export type Specialization = {
    nameCZ: string;
    nameEN: string;
    descCZ: string;
    descEN: string;
    base: OrderSubject[];
    plan: Record<string, OrderSubject[]>;
};

export type Spec = Record<string, Specialization>;

export type ChoiceSubject =
    | {
          code: string;
          nazevCZ: string;
          nazevEN: string;
          credits: number;
      }
    | string;

export type Choice = {
    type: `${number}:${number}`;
    list: ChoiceSubject[];
    refnCZ: string;
    refnEN: string;
    credits?: number;
};
export type Choices = Record<string, Choice>;

export type SubjectData = {
    details: Details;
    spec: Spec;
    choices: Choices;
    substitutions: Substitutions;
};

export type Substitutions = Record<string, Substitution>;
type Substitution = {
    nameCZ: string;
    removes: string[];
    adds: { code: string; semester: number }[];
    type: string;
};

export type EdgeOffsets = Record<string, number>;

export type Coordinates = { x: number; y: number };
export type CodeToPosition = Record<string, Coordinates>;
export type PositionToCode = string[][];
