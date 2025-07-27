import { ResearchResult } from '../types';

const delay = (ms: number, signal: AbortSignal) => new Promise((resolve, reject) => {
  const timeout = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => {
    clearTimeout(timeout);
    const error = new Error('Mock API call aborted');
    error.name = 'AbortError';
    reject(error);
  });
});

export const runOllamaAgent = async (
  model: string,
  prompt: string,
  signal: AbortSignal
): Promise<string> => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        stream: false, // We want the full response at once
      }),
      signal, // Pass the abort signal to the fetch request
    });

    if (signal.aborted) {
      throw new Error('Ollama API call aborted');
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        // Check if the model is available
        if (errorText.includes('model not found')) {
             throw new Error(`Model '${model}' not found on local Ollama server. Please ensure you have pulled the model (e.g., 'ollama pull ${model}').`);
        }
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.message && data.message.content) {
      return data.message.content;
    } else {
      throw new Error("Received an unexpected response format from Ollama API.");
    }

  } catch (error: any) {
    if (error.name === 'AbortError' || signal.aborted) {
       const abortError = new Error('API call aborted by user');
       abortError.name = 'AbortError';
       throw abortError;
    }
    
    // Provide a more helpful error for the common CORS issue
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`Network error while connecting to Ollama.
1. Ensure your local Ollama server is running at http://localhost:11434.
2. Check for CORS issues. You may need to configure Ollama to allow requests from this web app's origin by setting the OLLAMA_ORIGINS environment variable (e.g., OLLAMA_ORIGINS='*').`);
    }

    console.error("Ollama API Error:", error);
    // Re-throw the original or a wrapped error, ensuring it's an Error object
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`An unknown error occurred with Ollama: ${error}`);
  }
};


export const runTavilySearch = async (
  query: string,
  signal: AbortSignal
): Promise<{ results: ResearchResult[] }> => {
  await delay(1500, signal);
  // Updated mock results to be relevant to the default topic
  return {
    results: [
      {
        title: 'AI-Powered Smart Grids for Renewable Energy',
        url: 'https://example.com/ai-smart-grids',
        snippet: 'Artificial intelligence is revolutionizing energy distribution by creating smart grids that can balance supply and demand from intermittent renewable sources like solar and wind in real-time.',
      },
      {
        title: 'Predictive Maintenance for Wind Turbines using AI',
        url: 'https://example.com/ai-wind-turbines',
        snippet: 'AI algorithms analyze sensor data from wind turbines to predict maintenance needs, reducing downtime and increasing the efficiency and lifespan of wind farms.',
      },
      {
        title: 'Optimizing Solar Panel Output with Machine Learning',
        url: 'https://example.com/ml-solar-panels',
        snippet: 'Machine learning models help optimize the placement and angle of solar panels and forecast energy output based on weather patterns, maximizing the electricity generated.',
      },
    ],
  };
};

export const runLocalSearch = async (
  query: string,
  signal: AbortSignal
): Promise<{ results: ResearchResult[] }> => {
  await delay(2500, signal);
  // Updated mock results to be relevant to the default topic
  return {
    results: [
      {
        title: 'Local Doc: Report on Energy Storage Solutions (PDF)',
        url: 'file:///local/docs/energy_storage.pdf',
        snippet: 'This internal report details the growing importance of battery storage systems to complement AI-managed renewable energy grids, ensuring a stable power supply.',
      },
      {
        title: 'Local Doc: Meeting Notes on Grid Modernization (TXT)',
        url: 'file:///local/notes/grid_modernization.txt',
        snippet: 'Discussion points from the Q3 planning meeting focused on the capital investment required for AI-driven grid upgrades and the projected ROI over the next decade.',
      },
    ],
  };
};
