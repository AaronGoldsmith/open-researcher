
import { Settings, AgentName } from './types';

export const AGENT_NAMES: AgentName[] = ['supervisor', 'researcher', 'writer'];

export const OLLAMA_MODELS: string[] = ['llama3.2', 'mistral', 'gemma3'];
export const GEMINI_MODELS: string[] = ['gemini-2.5-flash'];

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  tavilyApiKey: '',
  researchTopic: 'The future of AI in renewable energy',
  agents: {
    supervisor: { model: 'llama3.2', provider: 'ollama' },
    researcher: { model: 'llama3.2', provider: 'ollama' },
    writer: { model: 'llama3.2', provider: 'ollama' },
  },
  searchMode: 'tavily',
  iterations: 3,
};