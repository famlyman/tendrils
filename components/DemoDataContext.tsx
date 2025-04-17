// DemoDataContext.tsx
// Provides demo data and a toggle for demo mode in the Tendrils app.
import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  demoVines,
  demoProfiles,
  demoTeams,
  demoMatches,
  demoStandings,
  demoTeamStandings,
} from "../demoData";

interface DemoDataContextProps {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  vines: typeof demoVines;
  profiles: typeof demoProfiles;
  teams: any[];
  matches: typeof demoMatches;
  standings: typeof demoStandings;
  teamStandings: typeof demoTeamStandings;
  upcomingMatches: any[];
  addDemoTeam: (team: any) => void;
}

const DemoDataContext = createContext<DemoDataContextProps | undefined>(undefined);

export const DemoDataProvider = ({ children }: { children: ReactNode }) => {
  const [demoMode, setDemoMode] = useState(true); // default ON for demo
  const [teams, setTeams] = useState<any[]>(demoTeams);
  const addDemoTeam = (team: any) => setTeams(prev => [...prev, team]);
  return (
    <DemoDataContext.Provider
      value={{
        demoMode,
        setDemoMode,
        vines: demoVines,
        profiles: demoProfiles,
        teams,
        matches: demoMatches,
        standings: demoStandings,
        teamStandings: demoTeamStandings,
        upcomingMatches: [], // empty for now
        addDemoTeam,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
};

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within a DemoDataProvider");
  return ctx;
}
