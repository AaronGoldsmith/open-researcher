
import React, { useState, useCallback, useRef } from 'react';
import { Settings, ResearchState, AgentName, LogEntry, AgentSettings, ModelProvider } from './types';
import { DEFAULT_SETTINGS, AGENT_NAMES } from './constants';
import ControlPanel from './components/ControlPanel';
import Dashboard from './components/Dashboard';
import { startResearchProcess } from './services/researchService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [researchState, setResearchState] = useState<ResearchState>('idle');
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalReport, setFinalReport] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSettingsChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAgentSettingsChange = useCallback((agent: AgentName, newSettings: Partial<AgentSettings>) => {
    setSettings(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agent]: {
          ...prev.agents[agent],
          ...newSettings,
        }
      }
    }));
  }, []);
  
  const handleModelChange = useCallback((agent: AgentName, model: string, provider: ModelProvider) => {
    handleAgentSettingsChange(agent, { model, provider });
  }, [handleAgentSettingsChange]);

  const clearResearch = () => {
    setLogs([]);
    setFinalReport('');
    setActiveAgent(null);
    setError(null);
  };

  const handleStartResearch = useCallback(async () => {
    if (researchState === 'running') return;

    clearResearch();
    setResearchState('running');
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const addLog = (log: LogEntry) => {
      setLogs(prevLogs => [...prevLogs, log]);
    };

    try {
      await startResearchProcess({
        settings,
        signal,
        setActiveAgent,
        addLog,
        setFinalReport,
      });
      setResearchState('completed');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Research process was aborted.');
        setResearchState('stopped');
        setError('Research process was stopped by the user.');
        addLog({ agent: activeAgent || 'supervisor', message: 'Process stopped by user.', timestamp: new Date().toISOString() });
      } else {
        console.error('Research process failed:', err);
        setResearchState('error');
        setError(err.message || 'An unknown error occurred.');
        addLog({ agent: activeAgent || 'supervisor', message: `Error: ${err.message}`, timestamp: new Date().toISOString() });
      }
    } finally {
      setActiveAgent(null);
    }
  }, [settings, researchState, activeAgent]);

  const handleStopResearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <ControlPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onAgentModelChange={handleModelChange}
        onStartResearch={handleStartResearch}
        onStopResearch={handleStopResearch}
        researchState={researchState}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-700 bg-gray-800">
            <h1 className="text-xl font-bold text-white">Multi-Agent Research Dashboard</h1>
        </header>
        <Dashboard
          agentNames={AGENT_NAMES}
          activeAgent={activeAgent}
          logs={logs}
          finalReport={finalReport}
          researchState={researchState}
          error={error}
          researchTopic={settings.researchTopic}
        />
      </main>
    </div>
  );
};

export default App;
