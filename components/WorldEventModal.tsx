"use client";
import { useState } from "react";
import { useConfigStore } from "@/store/config";
import { useSidebarLogStore } from "@/store/sidebarLog";
import { useConversationStore } from "@/store/conversation";

interface WorldEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorldEventModal({ isOpen, onClose }: WorldEventModalProps) {
  const [eventDescription, setEventDescription] = useState("");
  const { setWorldEvent, worldEvent } = useConfigStore();
  const { logMessage } = useSidebarLogStore();
  const { notifyWorldEvent } = useConversationStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDescription.trim()) return;

    // 设置世界事件
    const newWorldEvent = {
      description: eventDescription.trim(),
      createdAt: new Date().toISOString(),
      id: `event-${Date.now()}`
    };

    setWorldEvent(newWorldEvent);
    logMessage(`🌍 世界事件已触发: ${eventDescription.trim()}`, "system");

    // 通知正在进行的对话
    notifyWorldEvent(newWorldEvent);

    // 关闭弹窗并重置输入
    setEventDescription("");
    onClose();
  };

  const clearEvent = () => {
    setWorldEvent(null);
    logMessage("🌍 世界事件已清除", "system");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">世界事件</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {worldEvent && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm font-medium text-yellow-800">当前世界事件:</div>
            <div className="text-sm text-yellow-700 mt-1">{worldEvent.description}</div>
            <button
              onClick={clearEvent}
              className="text-xs text-red-600 hover:text-red-700 mt-2 underline"
            >
              清除当前事件
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-2">
              描述世界事件
            </label>
            <textarea
              id="eventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              placeholder="例如：突然下起了大雨，所有人都躲进了室内继续聊天..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {eventDescription.length}/200
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!eventDescription.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
            >
              触发事件
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          <div className="font-medium mb-1">提示:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>世界事件会影响所有 AI 的后续对话</li>
            <li>正在进行的对话也会立即收到事件通知</li>
            <li>事件应该具体且有趣，能引发有意义的讨论</li>
          </ul>
        </div>
      </div>
    </div>
  );
}