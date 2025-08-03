import { callMoonshot } from "@/lib/llm";
import { useConfigStore } from "@/store/config";
import { Agent } from "@/types";
import { ENCOUNTER_DISTANCE, TALK_INITIATION_COOLDOWN } from "./constant";
import { useSidebarLogStore } from "@/store/sidebarLog";

/**
 * agentA 决定是否想和 otherAgent 聊
 */
export async function decideToTalk(agent: Agent, otherAgent: Agent) {
  const currentWorldEvent = useConfigStore.getState().worldEvent; // 如果是全局状态，可以从 store 拿

  const eventContext = currentWorldEvent
    ? `当前世界事件是: "${currentWorldEvent.description}".`
    : "当前没有特殊事件发生。";

  const memoryContext =
    agent.memory?.length > 0
      ? `你的记忆中有这些过去的互动摘要:\n- ${agent.memory.join("\n- ")}`
      : "你还没有任何过去的互动记忆。";

  const prompt = `你叫 ${agent.name}。
你的背景信息：
${agent.background}

${memoryContext}
${eventContext}
你当前的动机是 ${JSON.stringify(agent.motivation)}。
你现在遇到了 ${otherAgent.name}。
基于你的背景、记忆和当前情况，你是否想和TA发起对话？请只返回一个JSON对象，格式为: {"should_initiate": boolean, "reason": "你的理由"}`;

  const decision = await callMoonshot(prompt);
  if (decision.error) {
    return {
      should_initiate: false,
      reason: `AI决策时发生错误: ${decision.message}`,
    };
  }

  return decision;
}

/**
 * 检测相遇
 */
export function detectEncounter(agentA: Agent, agentB: Agent) {
  const { logMessage } = useSidebarLogStore.getState();
  if (!["wandering", "finding"].includes(agentA.state)) return false;
  if (!["wandering", "finding"].includes(agentB.state)) return false;

  const distance = getDistance(agentA, agentB);
  if (distance >= ENCOUNTER_DISTANCE) return false;

  const now = Date.now();
  const lastCheckA = agentA.lastEncounterCheck[agentB.id] || 0;
  const lastCheckB = agentB.lastEncounterCheck[agentA.id] || 0;

  if (
    now - lastCheckA > TALK_INITIATION_COOLDOWN &&
    now - lastCheckB > TALK_INITIATION_COOLDOWN
  ) {
    agentA.lastEncounterCheck[agentB.id] = now;
    agentB.lastEncounterCheck[agentA.id] = now;
    logMessage(
        `🤝 ${agentA.name} 和 ${agentB.name} 相遇了...`,
        "system"
    );
    return true;
  }

  return false;
}

/**
 * 决定两个 agent 是否想聊
 */
export async function shouldAgentsTalk(agentA: Agent, agentB: Agent) {
  const decisionA = await decideToTalk(agentA, agentB);
  const decisionB = await decideToTalk(agentB, agentA);

  return {
    decisionA,
    decisionB,
    shouldTalk: decisionA.should_initiate && decisionB.should_initiate,
  };
}


// 假数据生成器
export function getRandomPosition() {
  return {
    x: Math.floor(Math.random() * 600),
    y: Math.floor(Math.random() * 400),
  };
}

/**
 * 计算两个 agent 之间的距离
 */
export function getDistance(agent1: Agent, agent2: Agent) {
  return Math.sqrt(
    Math.pow(agent1.x - agent2.x, 2) + Math.pow(agent1.y - agent2.y, 2)
  );
}
