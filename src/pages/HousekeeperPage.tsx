import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { FinancePage } from './FinancePage';
import { useAgents } from '../hooks/useAgents';
import { useTheme } from '../hooks/useTheme';
import { useSessions } from '../hooks/useSessions';
import { useModels } from '../hooks/useModels';
import { useChat } from '../hooks/useChat';
import { PermissionMode } from '../types';

// 原「私人财务管家」对话页，作为新系统的「管家」标签页
export function HousekeeperPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { agents, addAgent, updateAgent, deleteAgent, getAgent } = useAgents();
  const { models, selectedModel, setSelectedModel, fetchModels } = useModels();
  const {
    sessions, setSessions, currentSessionId, setCurrentSessionId, currentSession,
    sessionModels, fetchSessions, deleteSession, updateSessionModel, addSession,
    updateSession, updateSessionMessages,
  } = useSessions();

  const {
    isLoading, inputValue, setInputValue, permissionRequest,
    sendMessage, handleStop, handlePermissionAllow, handlePermissionDeny,
  } = useChat({
    currentSession, currentSessionId, selectedModel, getAgent, addSession,
    updateSession, updateSessionMessages, updateSessionModel, setCurrentSessionId, setSessions,
  });

  const currentAgent = currentSession?.agentId ? getAgent(currentSession.agentId) : getAgent('default');

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => {
    if (currentSessionId && sessionModels[currentSessionId]) setSelectedModel(sessionModels[currentSessionId]);
    else if (currentSession) setSelectedModel(currentSession.model);
  }, [currentSessionId, sessionModels, currentSession, setSelectedModel]);

  const updateCurrentSessionModel = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    if (currentSessionId) updateSessionModel(currentSessionId, modelId);
  }, [currentSessionId, updateSessionModel, setSelectedModel]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    setCurrentSessionId(null);
    navigate('/housekeeper');
  }, [deleteSession, navigate, setCurrentSessionId]);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    navigate('/housekeeper');
  }, [navigate, setCurrentSessionId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, [setCurrentSessionId]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('default');

  return (
    <div className="flex h-full w-full fm-app">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isSettingsPage={false}
        sidebarOpen={sidebarOpen}
        agents={agents}
        getAgent={getAgent}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => {}}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          isSettingsPage={false}
          sidebarOpen={sidebarOpen}
          currentSession={currentSession}
          currentAgent={currentAgent}
          models={models}
          selectedModel={selectedModel}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRefreshModels={fetchModels}
          onModelChange={updateCurrentSessionModel}
        />
        <FinancePage
          currentSession={currentSession}
          isLoading={isLoading}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={sendMessage}
          onStop={handleStop}
          ready={Boolean(selectedModel)}
        />
      </main>
    </div>
  );
}
