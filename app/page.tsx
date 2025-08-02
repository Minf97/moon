export default function Home() {
  return (
    <div
      id="main-app"
      className="w-screen h-screen p-4 flex gap-4 relative"
    >
      {/* Main Map Area */}
      <div className="w-3/4 h-full flex flex-col gap-4">
        <div className="flex-grow relative">
          <div id="map" className="map"></div>
          <div id="controls" className="absolute top-2 left-2 flex gap-2">
            <button id="start-sim-btn" className="control-button">
              🚀 开始模拟
            </button>
            <button id="event-trigger-btn" className="control-button hidden">
              ✨ 触发世界事件
            </button>
          </div>
        </div>
        <div
          id="selected-agent-panel"
          className="h-48 p-4 border border-gray-200 rounded-lg shadow-sm selected-agent-panel hidden"
        >
          <h3 className="font-bold text-lg">选中的Agent信息</h3>
          <div
            id="agent-details"
            className="mt-2 text-sm grid grid-cols-2 gap-x-4"
          ></div>
        </div>
      </div>

      {/* Log Panel */}
      <div
        id="log-panel-container"
        className="w-1/4 h-full flex flex-col bg-white rounded-lg shadow-md"
      >
        <h2 className="text-lg font-bold p-4 border-b border-gray-200">
          系统日志与对话
        </h2>
        <div id="log-panel" className="flex-grow overflow-y-auto p-2">
          {/* Logs will be appended here */}
        </div>
      </div>

      {/* Agent Details Sidebar */}
      <div
        id="agent-sidebar"
        className="absolute right-4 top-4 bottom-4 w-1/4 flex flex-col bg-white rounded-lg shadow-lg hidden"
        style={{ zIndex: 50 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Agent 详情</h2>
          <button
            id="close-sidebar"
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <div id="sidebar-agent-info">
            {/* Agent info will be inserted here */}
          </div>
        </div>
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              id="personal-info-btn"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md transition-colors font-medium"
            >
              📝 个人信息
            </button>
            <button
              id="history-chat-btn"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md transition-colors font-medium"
            >
              📜 历史对话
            </button>
            <button
              id="start-chat-btn"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md transition-colors font-medium"
            >
              💬 聊天
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
