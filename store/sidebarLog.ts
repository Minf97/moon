// 侧边栏的日志记录
import { create } from "zustand";

export type LogItem = {
  message: string;
  type?: "system" | "dialogue" | "memory";
};

type LogStore = {
  logs: LogItem[];
  logMessage: (message: string, type?: LogItem["type"]) => void;
  clear: () => void;
};

export const useSidebarLogStore = create<LogStore>((set) => ({
  logs: [],
  logMessage: (message, type = "system") =>
    set((state) => ({ logs: [...state.logs, { message, type }] })),

  clear: () => set({ logs: [] }),
}));
