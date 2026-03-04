import { useState } from 'react';

interface CopyButtonProps {
  content: string;
  label?: string;
  size?: 'sm' | 'md';
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};

export default function CopyButton({
  content,
  label = 'Copy',
  size = 'sm',
}: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 1500);
  }

  const sizeClass = SIZE_CLASSES[size];

  const stateStyles = {
    idle:   'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    copied: 'bg-green-50 text-green-700 border-green-300',
    failed: 'bg-red-50 text-red-600 border-red-300',
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 font-medium rounded border transition-colors duration-150 ${sizeClass} ${stateStyles[status]}`}
    >
      {status === 'copied' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'copied' ? 'Copied!' : status === 'failed' ? 'Failed' : label}
    </button>
  );
}
