import { createContext, useContext, useState } from 'react';
import subjectInfoData from '@/data/final_tree.json';
import { SubjectData } from '@/types';

type SubjectDataContextType = {
    data: SubjectData;
    setData: React.Dispatch<React.SetStateAction<SubjectData>>;
    selectedSpecialization: string;
    setSelectedSpecialization: React.Dispatch<React.SetStateAction<string>>;
    highlightedSubjects: Set<string>;
    setHighlightedSubjects: React.Dispatch<React.SetStateAction<Set<string>>>;
    selectedChoices: Record<string, Set<string>>;
    toggleChoice: (choiceCode: string, subjectCode: string) => void;
    activeSubstitutions: Set<string>;
    toggleSubstitution: (key: string) => void;
};

const SubjectDataContext = createContext<SubjectDataContextType | null>(null);

type SubjectDataProvider = {
    children: React.ReactNode;
};

export function SubjectDataProvider({ children }: SubjectDataProvider) {
    const [data, setData] = useState<SubjectData>(subjectInfoData);
    const [selectedSpecialization, setSelectedSpecialization] = useState<string>(
        Object.keys(subjectInfoData.spec)[0]
    );

    const [highlightedSubjects, setHighlightedSubjects] = useState<Set<string>>(new Set());
    const [selectedChoices, setSelectedChoices] = useState<Record<string, Set<string>>>({});
    const [activeSubstitutions, setActiveSubstitutions] = useState<Set<string>>(new Set());

    const toggleSubstitution = (key: string) => {
        setActiveSubstitutions((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleChoice = (choiceCode: string, subjectCode: string) => {
        setSelectedChoices((prev) => {
            const current = new Set(prev[choiceCode] ?? []);
            if (current.has(subjectCode)) {
                current.delete(subjectCode);
            } else {
                current.add(subjectCode);
            }
            return { ...prev, [choiceCode]: current };
        });
    };

    return (
        <SubjectDataContext.Provider
            value={{
                data,
                setData,
                selectedSpecialization,
                setSelectedSpecialization,
                activeSubstitutions,
                toggleSubstitution,
                highlightedSubjects,
                setHighlightedSubjects,
                selectedChoices,
                toggleChoice
            }}
        >
            {children}
        </SubjectDataContext.Provider>
    );
}

function useSubjectContext() {
    const context = useContext(SubjectDataContext);
    if (!context) {
        throw new Error('useSubjectContext must be used only inside SubjectDataProvider!');
    }
    return context;
}

export function useData(): SubjectData {
    return useSubjectContext().data;
}

export function useSetData(): React.Dispatch<React.SetStateAction<SubjectData>> {
    return useSubjectContext().setData;
}

export function useSelectedSpecialization(): string {
    return useSubjectContext().selectedSpecialization;
}

export function useSetSelectedSpecialization(): React.Dispatch<React.SetStateAction<string>> {
    return useSubjectContext().setSelectedSpecialization;
}

export function useHighlightedSubjects(): Set<string> {
    return useSubjectContext().highlightedSubjects;
}
export function useSetHighlightedSubjects() {
    return useSubjectContext().setHighlightedSubjects;
}

export function useSelectedChoices(): Record<string, Set<string>> {
    return useSubjectContext().selectedChoices;
}

export function useToggleChoice() {
    return useSubjectContext().toggleChoice;
}

export function useActiveSubstitutions(): Set<string> {
    return useSubjectContext().activeSubstitutions;
}

export function useToggleSubstitution() {
    return useSubjectContext().toggleSubstitution;
}
