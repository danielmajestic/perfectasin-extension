/**
 * SophiaChat — Reusable AI support chat widget
 *
 * Two modes:
 *   "page"     — full embedded chat panel (use on /support)
 *   "floating" — bottom-right FAB that expands to a chat window
 *
 * Props:
 *   source       — which site ("perfectasin" | "titleperfect" | "ravingfans" | "danknows")
 *   mode         — "page" (default) | "floating"
 *   apiEndpoint  — defaults to https://api.perfectasin.com/api/support/chat
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StoredSession {
  messages: Message[];
  conversationId: string;
}

interface ApiResponse {
  response: string;
  escalated: boolean;
  conversation_id: string;
}

export interface SophiaChatProps {
  source: string;
  mode?: 'page' | 'floating';
  apiEndpoint?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_API = 'https://api.perfectasin.com/api/support/chat';

const GREETINGS: Record<string, string> = {
  perfectasin: "Hi! I'm Sophia, PerfectASIN's support specialist. How can I help you today?",
  titleperfect: "Hi! I'm Sophia from the TitlePerfect team. What can I help you with?",
  ravingfans: "Hi! I'm Sophia from RavingFans.ai. Are you looking to learn about our services?",
  danknows: "Hi! I'm Sophia. How can I help you today?",
};

const ESCALATION_MESSAGE =
  "I've connected you with Dan, our founder. He'll follow up within a few hours at the email you signed in with.";

const AVATAR_SRC = '/sophia-avatar.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionKey(source: string) {
  return `sophia_session_${source}`;
}

function loadSession(source: string): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(getSessionKey(source));
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function saveSession(source: string, session: StoredSession) {
  try {
    sessionStorage.setItem(getSessionKey(source), JSON.stringify(session));
  } catch {
    // sessionStorage unavailable — degrade gracefully
  }
}

function getGreeting(source: string): string {
  return GREETINGS[source] ?? "Hi! I'm Sophia. How can I help you today?";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SophiaAvatar({ size = 32 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Fallback: initials avatar
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-white select-none"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #1B3A5C 0%, #2a4a6b 100%)',
          border: '1.5px solid rgba(255,153,0,0.4)',
          fontSize: size * 0.38,
        }}
        aria-hidden="true"
      >
        S
      </div>
    );
  }

  return (
    <img
      src={AVATAR_SRC}
      alt="Sophia"
      className="flex-shrink-0 rounded-full object-cover select-none"
      style={{
        width: size,
        height: size,
        border: '1.5px solid rgba(255,153,0,0.4)',
      }}
      onError={() => setImgError(true)}
      draggable={false}
    />
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in" role="status" aria-label="Sophia is typing">
      <SophiaAvatar size={28} />
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{
          background: '#0F2439',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          className="typing-dot block rounded-full animate-bounce-dot"
          style={{ width: 7, height: 7, background: '#FF9900' }}
        />
        <span
          className="typing-dot block rounded-full animate-bounce-dot"
          style={{ width: 7, height: 7, background: '#FF9900' }}
        />
        <span
          className="typing-dot block rounded-full animate-bounce-dot"
          style={{ width: 7, height: 7, background: '#FF9900' }}
        />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div
          className="max-w-[78%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
          style={{
            background: 'rgba(255,153,0,0.15)',
            border: '1px solid rgba(255,153,0,0.25)',
            color: '#F1F5F9',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Sophia's message
  const isEscalation = message.content === ESCALATION_MESSAGE;

  return (
    <div className="flex items-end gap-2 animate-slide-up">
      <SophiaAvatar size={28} />
      <div
        className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
        style={
          isEscalation
            ? {
                background: 'rgba(255,153,0,0.08)',
                border: '1px solid rgba(255,153,0,0.35)',
                color: '#FCD34D',
              }
            : {
                background: '#0F2439',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E2E8F0',
              }
        }
      >
        {isEscalation && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF9900"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#FF9900' }}>
              Escalated to Dan
            </span>
          </div>
        )}
        {message.content}
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
// The full chat UI — shared between page and floating modes.

interface ChatPanelProps {
  source: string;
  apiEndpoint: string;
  onClose?: () => void; // only in floating mode
  isFloating: boolean;
}

function ChatPanel({ source, apiEndpoint, onClose, isFloating }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Restore session or seed greeting ──────────────────────────────────────
  useEffect(() => {
    const stored = loadSession(source);
    if (stored && stored.messages.length > 0) {
      setMessages(stored.messages);
      setConversationId(stored.conversationId);
    } else {
      const greeting = getGreeting(source);
      const initial: Message = { role: 'assistant', content: greeting };
      setMessages([initial]);
    }
  }, [source]);

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Persist session on every message change ────────────────────────────────
  useEffect(() => {
    if (messages.length > 1 && conversationId) {
      saveSession(source, { messages, conversationId });
    }
  }, [messages, conversationId, source]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Resolve or generate conversation ID
    const cid = conversationId || generateUUID();
    if (!conversationId) setConversationId(cid);

    // Optimistically add user message
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build history (all prior messages, excluding the greeting assistant msg
    // when it's the only one — keep server context clean)
    const history = messages.filter((m) => !(m.role === 'assistant' && messages.length === 1));

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          message: text,
          conversation_id: cid,
          history,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();

      const replyContent = data.escalated ? ESCALATION_MESSAGE : data.response;

      const assistantMsg: Message = { role: 'assistant', content: replyContent };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation ID from server in case it differs
      if (data.conversation_id && data.conversation_id !== cid) {
        setConversationId(data.conversation_id);
      }
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment, or email us at support@perfectasin.com.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      // Restore focus to input after response
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, conversationId, messages, apiEndpoint, source]);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height then set to scrollHeight
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div
      className="flex flex-col"
      style={{
        height: isFloating ? '520px' : '100%',
        background: '#0A1929',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: '#0F2439',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <SophiaAvatar size={38} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Sophia</span>
            {/* Online indicator */}
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: '#4ADE80' }}
            >
              <span
                className="block rounded-full"
                style={{ width: 7, height: 7, background: '#22C55E' }}
                aria-hidden="true"
              />
              Online
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: '#64748B' }}>
            Chief Customer Success Manager
          </p>
        </div>

        {/* Close button — floating mode only */}
        {isFloating && onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 32,
              height: 32,
              color: '#64748B',
            }}
            aria-label="Close chat"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#E2E8F0')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = '#64748B')
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto sophia-scrollbar"
        style={{ padding: '16px 16px 8px' }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-3 py-3"
        style={{
          background: '#0F2439',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{
            background: '#0A1929',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message Sophia..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm outline-none leading-relaxed"
            style={{
              color: '#E2E8F0',
              caretColor: '#FF9900',
              maxHeight: 120,
              minHeight: 24,
            }}
            aria-label="Message input"
            disabled={isLoading}
          />

          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              width: 34,
              height: 34,
              background: canSend ? '#FF9900' : 'rgba(255,153,0,0.2)',
              color: canSend ? '#0A1929' : 'rgba(255,255,255,0.3)',
              cursor: canSend ? 'pointer' : 'default',
              transform: canSend ? 'scale(1)' : 'scale(0.95)',
            }}
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        <p className="text-center mt-2 text-xs" style={{ color: '#475569' }}>
          Press <kbd className="font-mono">Enter</kbd> to send ·{' '}
          <kbd className="font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function SophiaChat({
  source,
  mode = 'page',
  apiEndpoint = DEFAULT_API,
}: SophiaChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (mode === 'page') {
    return (
      <div className="w-full h-full">
        <ChatPanel
          source={source}
          apiEndpoint={apiEndpoint}
          isFloating={false}
        />
      </div>
    );
  }

  // ── Floating mode ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed z-[9999]"
      style={{ bottom: 24, right: 24 }}
      aria-label="Sophia chat widget"
    >
      {/* Chat window */}
      {isOpen && (
        <div
          className="mb-4 rounded-2xl overflow-hidden shadow-2xl animate-bubble-in"
          style={{
            width: 380,
            border: '1px solid rgba(255,255,255,0.1)',
            transformOrigin: 'bottom right',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Sophia"
        >
          <ChatPanel
            source={source}
            apiEndpoint={apiEndpoint}
            onClose={() => setIsOpen(false)}
            isFloating={true}
          />
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center rounded-full shadow-lg transition-transform duration-200 active:scale-95"
        style={{
          width: 60,
          height: 60,
          background: '#FF9900',
          color: '#0A1929',
          boxShadow: '0 4px 24px rgba(255,153,0,0.4)',
        }}
        aria-label={isOpen ? 'Close chat' : 'Chat with Sophia'}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {isOpen ? (
          /* X icon when open */
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          /* Chat bubble icon when closed */
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
