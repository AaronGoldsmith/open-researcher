
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const runGeminiAgent = async (
  apiKey: string,
  model: string,
  prompt: string,
  signal: AbortSignal
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please provide it in the settings panel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const abortPromise = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => {
      const error = new Error('API call aborted by user');
      error.name = 'AbortError';
      reject(error);
    });
  });

  try {
    const responsePromise = ai.models.generateContent({
      model,
      contents: prompt,
    });

    const result: GenerateContentResponse = await Promise.race([responsePromise, abortPromise]);

    const text = result.text;
    if (text) {
      return text;
    } else {
      throw new Error("Received an empty response from Gemini API.");
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error("Gemini API Error:", error);
    // Provide a more user-friendly error message
    const message = error.message?.includes('API key not valid')
        ? 'The provided Gemini API key is not valid. Please check and try again.'
        : `An error occurred with the Gemini API: ${error.message}`;
    throw new Error(message);
  }
};
