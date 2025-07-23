export const ApiKeyService = {
  getApiKey: (): string | null => {
    return localStorage.getItem('gemini_api_key');
  },

  setApiKey: (apiKey: string): void => {
    localStorage.setItem('gemini_api_key', apiKey);
  },

  clearApiKey: (): void => {
    localStorage.removeItem('gemini_api_key');
  },
};
