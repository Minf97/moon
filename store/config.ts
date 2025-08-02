

// 一些全局状态，和配置
import { create } from "zustand";
import { useSidebarLogStore } from "./sidebarLog";

type ConfigStore = {
  gameStart: boolean;
  startGame: () => void;
  worldEvent: any;
  setWorldEvent: (worldEvent: any) => void;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  gameStart: false,
  worldEvent: null,

  /**
   * 开始游戏
   */
  startGame: () => {
    const { logMessage } = useSidebarLogStore.getState();
    logMessage("🚀 游戏开始！Agent们开始自由行动和交互。");
    set({ gameStart: true });
  },

  /**
   * 设置世界事件
   */
  setWorldEvent: (worldEvent: any) => {
    set({ worldEvent });
  },
}));
