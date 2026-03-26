import { createContext, useContext, useState } from "react";
import subjectInfoData from "@/data/final_tree.json";
import { SubjectData } from "@/types/subjects";


type SubjectDataContextType = {
  data: SubjectData;
  setData: React.Dispatch<React.SetStateAction<SubjectData>>;
  selectedSpecialization: string;
  setSelectedSpecialization: React.Dispatch<React.SetStateAction<string>>;
  showAdvancedMath: boolean;
  setShowAdvancedMath: React.Dispatch<React.SetStateAction<boolean>>;
  showAdvancedInformatics: boolean;
  setShowAdvancedInformatics: React.Dispatch<React.SetStateAction<boolean>>;
  showAdvancedBiology: boolean;
  setShowAdvancedBiology: React.Dispatch<React.SetStateAction<boolean>>;
  highlightedSubjects: Set<string>;
  setHighlightedSubjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedChoices: Record<string, Set<string>>;
  toggleChoice: (choiceCode: string, subjectCode: string, multi?: boolean) => void;
}

const SubjectDataContext = createContext<SubjectDataContextType | null>(null);

type SubjectDataProvider = {
  children: React.ReactNode
}

export function SubjectDataProvider({ children }: SubjectDataProvider) {
  const [data, setData] = useState<SubjectData>(subjectInfoData);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(Object.keys(subjectInfoData.spec)[0]);
  const [showAdvancedMath, setShowAdvancedMath] = useState<boolean>(false);
  const [showAdvancedInformatics, setShowAdvancedInformatics] = useState<boolean>(false);
  const [showAdvancedBiology, setShowAdvancedBiology] = useState<boolean>(false);
  const [highlightedSubjects, setHighlightedSubjects] = useState<Set<string>>(new Set());
  const [selectedChoices, setSelectedChoices] = useState<Record<string, Set<string>>>({});

  const toggleChoice = (choiceCode: string, subjectCode: string) => {
      setSelectedChoices(prev => {
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
    <SubjectDataContext value={{ data, setData, selectedSpecialization, setSelectedSpecialization,
                                 showAdvancedMath, setShowAdvancedMath,
                                 showAdvancedInformatics, setShowAdvancedInformatics,
                                 showAdvancedBiology, setShowAdvancedBiology,
                                 highlightedSubjects, setHighlightedSubjects,
                                 selectedChoices, toggleChoice  
    }}>
      {children}
    </SubjectDataContext>
  );
}

function useSubjectContext() {
  const context = useContext(SubjectDataContext);
  if (!context) {throw new Error("useSubjectContext must be used only inside SubjectDataProvider!")}
  return context;
}

export function useData() : SubjectData {
  return useSubjectContext().data;
}

export function useSetData() : React.Dispatch<React.SetStateAction<SubjectData>> {
  return useSubjectContext().setData;
}

export function useSelectedSpecialization() : string {
  return useSubjectContext().selectedSpecialization;
}

export function useSetSelectedSpecialization() : React.Dispatch<React.SetStateAction<string>> {
  return useSubjectContext().setSelectedSpecialization;
}

export function useSetShowAdvancedMath() : React.Dispatch<React.SetStateAction<boolean>> {
  return useSubjectContext().setShowAdvancedMath;
}

export function useShowAdvancedMath() : boolean {
  return useSubjectContext().showAdvancedMath;
}

export function useSetShowAdvancedInformatics() : React.Dispatch<React.SetStateAction<boolean>> {
  return useSubjectContext().setShowAdvancedInformatics;
}

export function useShowAdvancedInformatics() : boolean {
  return useSubjectContext().showAdvancedInformatics;
}

export function useSetShowAdvancedBiology() : React.Dispatch<React.SetStateAction<boolean>> {
  return useSubjectContext().setShowAdvancedBiology;
}

export function useShowAdvancedBiology() : boolean {
  return useSubjectContext().showAdvancedBiology;
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