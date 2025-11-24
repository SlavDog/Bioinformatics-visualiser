import { createContext, useContext } from "react";
import subjectInfoData from "@/data/final_tree.json";

const SubjectDataContext = createContext(null);

export function SubjectDataProvider({ children }) {
  return (
    <SubjectDataContext value={subjectInfoData}>
      {children}
    </SubjectDataContext>
  );
}

export function useData() {
  return useContext(SubjectDataContext);
}
