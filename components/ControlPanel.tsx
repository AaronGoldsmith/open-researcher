
import React from 'react';
import { Settings, ResearchState, AgentName, ModelProvider } from '../types';
import { AGENT_NAMES, OLLAMA_MODELS, GEMINI_MODELS } from '../constants';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';

interface ControlPanelProps {
  settings: Settings;
  onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onAgentModelChange: (agent: AgentName, model: string, provider: ModelProvider) => void;
  onStartResearch: () => void;
  onStopResearch: () => void;
  researchState: ResearchState;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onAgentModelChange,
  onStartResearch,
  onStopResearch,
  researchState,
}) => {
  const isRunning = researchState === 'running';

  const handleModelSelection = (agent: AgentName, value: string) => {
    const [provider, model] = value.split(':');
    onAgentModelChange(agent, model, provider as ModelProvider);
  };
  
  return (
    <aside className="w-96 bg-gray-800 p-6 flex flex-col border-r border-gray-700 overflow-y-auto">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-6 text-white">Configuration</h2>

        <div className="space-y-6">
          {/* Main Actions */}
          <div className="flex space-x-2">
            <button
              onClick={onStartResearch}
              disabled={isRunning}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent-blue hover:bg-accent-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {isRunning ? 'Running...' : 'Start Research'}
            </button>
            <button
              onClick={onStopResearch}
              disabled={!isRunning}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </button>
          </div>

          {/* Research Topic */}
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-400 mb-1">
              Research Topic
            </label>
            <textarea
              id="topic"
              rows={3}
              value={settings.researchTopic}
              onChange={(e) => onSettingsChange('researchTopic', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 focus:ring-accent-blue focus:border-accent-blue text-white"
            />
          </div>


          {/* Agent Model Selectors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Agent Models</h3>
            {AGENT_NAMES.map((agent) => (
              <div key={agent}>
                <label htmlFor={`${agent}-model`} className="block text-sm font-medium text-gray-400 mb-1 capitalize">
                  {agent}
                </label>
                <select
                  id={`${agent}-model`}
                  value={`${settings.agents[agent].provider}:${settings.agents[agent].model}`}
                  onChange={(e) => handleModelSelection(agent, e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 focus:ring-accent-blue focus:border-accent-blue text-white"
                >
                  <optgroup label="Ollama (Local)">
                    {OLLAMA_MODELS.map((model) => (
                      <option key={`ollama-${model}`} value={`ollama:${model}`}>{model}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Gemini (Cloud)">
                    {GEMINI_MODELS.map((model) => (
                      <option key={`gemini-${model}`} value={`gemini:${model}`}>{model}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ))}
          </div>

          {/* Search Mode */}
          <h3 className="text-lg font-semibold text-white">Research Settings</h3>
          <div>
            <label htmlFor="search-mode" className="block text-sm font-medium text-gray-400 mb-1">
              Search Mode
            </label>
            <select
              id="search-mode"
              value={settings.searchMode}
              onChange={(e) => onSettingsChange('searchMode', e.target.value as 'tavily' | 'local_search')}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 focus:ring-accent-blue focus:border-accent-blue text-white"
            >
              <option value="tavily">Tavily</option>
              <option value="local_search">Local Search (Simulated)</option>
            </select>
          </div>
        </div>
      </div>

          {/* API Keys */}
         <div className="mt-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-2 mt-2">
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center hover:text-gray-200 transition-colors duration-200"
          >
            Gemini API Key (Optional)
          </a>
        </label>
        <input
          id="apiKey"
          type="password"
          value={settings.apiKey}
          onChange={(e) => onSettingsChange('apiKey', e.target.value)}
          placeholder="Enter your Gemini API key"
          className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
        />
      </div>

      {/* --- Tavily API Key Section --- */}
      <div>
        <label htmlFor="tavilyApiKey" className="block text-sm font-medium text-gray-400 mb-2 mt-2">
          <a 
            href="https://app.tavily.com/home" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center hover:text-gray-200 transition-colors duration-200"
          >
            Tavily API Key (Optional)
          </a>
        </label>
        <input
          id="tavilyApiKey"
          type="password"
          value={settings.tavilyApiKey}
          onChange={(e) => onSettingsChange('tavilyApiKey', e.target.value)}
          placeholder="Enter key for real Tavily search"
          className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-white"
        />
      </div>

          
       <div className="mt-6 text-center text-xs text-gray-500">
        <p>Built with React</p>
      </div>
    </aside>
  );
};

export default ControlPanel;