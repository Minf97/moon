// stores/useSidebarStore.ts
import { create } from "zustand";
import { Agent } from "@/types";

type SidebarState = {
  currentSelectedAgent: Agent | null;
  currentActiveTab: "info" | "history" | "chat";
  setSelectedAgent: (agent: Agent | null) => void;
  setActiveTab: (tab: "info" | "history" | "chat") => void;
};

export const useDetailbarStore = create<SidebarState>((set) => ({
  currentSelectedAgent: null,
  currentActiveTab: "info",
  setSelectedAgent: (agent) => set({ currentSelectedAgent: agent }),
  setActiveTab: (tab) => set({ currentActiveTab: tab }),
}));
