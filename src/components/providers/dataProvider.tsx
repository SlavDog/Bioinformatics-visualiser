import { createContext, useContext } from "react";
import subjectInfoData from "@/data/final_tree.json";
import { SubjectData } from "@/types/subjects";

const SubjectDataContext = createContext<SubjectData | null>(null);

type SubjectDataProvider = {
  children: React.ReactNode
}

export function SubjectDataProvider({ children }: SubjectDataProvider) {
  return (
    <SubjectDataContext value={subjectInfoData}>
      {children}
    </SubjectDataContext>
  );
}

export function useData() : SubjectData {
  const context =  useContext(SubjectDataContext);
  if (!context) {throw new Error("useData must be used only inside SubjectDataProvider!")}
  return context;
}
