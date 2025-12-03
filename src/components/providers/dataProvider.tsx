import { createContext, useContext, useState } from "react";
import subjectInfoData from "@/data/final_tree.json";
import { SubjectData } from "@/types/subjects";


type SubjectDataContextType = {
  data: SubjectData;
  setData: React.Dispatch<React.SetStateAction<SubjectData>>;
}

const SubjectDataContext = createContext<SubjectDataContextType | null>(null);

type SubjectDataProvider = {
  children: React.ReactNode
}

export function SubjectDataProvider({ children }: SubjectDataProvider) {
  const [data, setData] = useState<SubjectData>(subjectInfoData);

  return (
    <SubjectDataContext value={{ data, setData }}>
      {children}
    </SubjectDataContext>
  );
}

export function useData() : SubjectData {
  const context =  useContext(SubjectDataContext);
  if (!context) {throw new Error("useData must be used only inside SubjectDataProvider!")}
  return context.data;
}

export function useSetData() : React.Dispatch<React.SetStateAction<SubjectData>> {
  const context =  useContext(SubjectDataContext);
  if (!context) {throw new Error("useSetData must be used only inside SubjectDataProvider!")}
  return context.setData;
}