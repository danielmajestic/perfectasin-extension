import { useState } from 'react';
import type { ImagePrompt } from '../../contexts/ASINContext';

interface ImagePromptCardProps {
  promptData: ImagePrompt;
  showNanoBanana?: boolean;
}

export default function ImagePromptCard({ promptData, showNanoBanana = true }: ImagePromptCardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptData.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(promptData.nanoBananaJson);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700">{promptData.label}</p>
            {promptData.strategyNote && (
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{promptData.strategyNote}</p>
            )}
          </div>
          {/* AI Studio link */}
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-[10px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 whitespace-nowrap"
          >
            Open AI Studio
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Prompt text */}
      <div className="px-3 py-2.5">
        <pre className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-2.5 max-h-36 overflow-y-auto font-sans">
          {promptData.prompt}
        </pre>
        {/* H8: character count */}
        <p className="text-[10px] text-gray-400 mt-1 text-right">{promptData.prompt.length} characters</p>
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-2.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleCopyPrompt}
          className={`text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${
            copiedPrompt
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
        >
          {copiedPrompt ? '✓ Copied!' : '📋 Copy Prompt'}
        </button>

        {showNanoBanana && (
          <>
            <button
              onClick={handleCopyJson}
              className={`text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${
                copiedJson
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              {copiedJson ? '✓ Copied!' : '🍌 Copy Nano Banana JSON'}
            </button>

            <button
              onClick={() => setShowJson(!showJson)}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showJson ? 'Hide JSON ▲' : 'Expand JSON ▼'}
            </button>
          </>
        )}
      </div>

      {/* H7: JSON preview — 3-line preview when collapsed, full when expanded */}
      {showNanoBanana && (
        <div className="px-3 pb-3">
          <pre className={`text-[10px] text-purple-800 bg-purple-50 rounded p-2.5 overflow-x-auto border border-purple-100 font-mono ${showJson ? 'max-h-32 overflow-y-auto' : 'overflow-hidden'}`}>
            {showJson
              ? promptData.nanoBananaJson
              : promptData.nanoBananaJson.split('\n').slice(0, 3).join('\n') + '\n...'}
          </pre>
        </div>
      )}

      {/* AI Studio instruction */}
      <div className="px-3 pb-3">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Open Google AI Studio → select <span className="font-medium text-gray-500">Gemini 2.5 Flash</span> → Image Generation → paste JSON
        </p>
      </div>
    </div>
  );
}
