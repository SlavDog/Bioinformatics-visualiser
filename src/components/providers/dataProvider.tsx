import { createContext, useContext, useState } from "react";
import subjectInfoData from "@/data/final_tree.json";
import { SubjectData } from "@/types/subjects";


type SubjectDataContextType = {
  data: SubjectData;
  setData: React.Dispatch<React.SetStateAction<SubjectData>>;
  selectedSpecialization: string;
  setSelectedSpecialization: React.Dispatch<React.SetStateAction<string>>;
}

const SubjectDataContext = createContext<SubjectDataContextType | null>(null);

type SubjectDataProvider = {
  children: React.ReactNode
}

export function SubjectDataProvider({ children }: SubjectDataProvider) {
  const [data, setData] = useState<SubjectData>(subjectInfoData);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("vyvoj");

  return (
    <SubjectDataContext value={{ data, setData, selectedSpecialization, setSelectedSpecialization}}>
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