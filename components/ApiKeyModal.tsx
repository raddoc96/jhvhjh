import React, { useState } from 'react';
import Button from './Button';
import { Input } from './Input';

interface ApiKeyModalProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit, isLoading }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = () => {
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-[#182634] p-8 rounded-xl shadow-2xl border border-[#223649] w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-slate-100 text-center">Enter Google Gemini API Key</h2>
        <p className="text-slate-400 text-center mb-6">
          To use this application, you need to provide your own Google Gemini API key.
        </p>
        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Your Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="form-input mt-1 block w-full rounded-lg text-white border border-[#314d68] bg-[#101a23] focus:border-[#0c7ff2] focus:ring focus:ring-[#0c7ff2]/50 h-12 px-4 placeholder:text-[#90adcb] text-sm"
          />
          <Button onClick={handleSubmit} disabled={!apiKey.trim() || isLoading} className="w-full">
            {isLoading ? 'Verifying...' : 'Start Application'}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">
          Your API key is stored securely in your browser's local storage and is not shared with anyone.
        </p>
      </div>
    </div>
  );
};
