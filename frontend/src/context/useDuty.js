import { createContext, useContext } from "react";

export const DutyContext = createContext();

export const useDuty = () => useContext(DutyContext);