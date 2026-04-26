import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ResultContext } from './result';
import type { ChatMessage, ChatSession } from '../types';
import { getAnonymousId } from '@/lib/anonymousId';
import { trimChatMessages } from '@/lib/trimMessages';

interface StoredData {
  analysisResult: string;
  planResult: string;
  chatSessions?: ChatSession[];
  activeSessionId?: string | null;
}


const SAVE_DEBOUNCE_MS = 800;
const MAX_STORAGE_SIZE = 4 * 1024 * 1024;

function generateId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    const text = firstUserMsg.content.trim();
    return text.length > 20 ? text.slice(0, 20) + '...' : text || '新对话';
  }
  return '新对话';
}

function loadFromStorage(storageKey: string): StoredData {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredData & { chatMessages?: ChatMessage[] };
      // 旧版本数据迁移
      if (Array.isArray(parsed.chatMessages) && !Array.isArray(parsed.chatSessions)) {
        const sessionId = generateId();
        const messages = parsed.chatMessages.map((msg, idx) =>
          msg.id ? msg : { ...msg, id: `legacy-${idx}-${Date.now().toString(36)}` }
        );
        return {
          analysisResult: parsed.analysisResult || '',
          planResult: parsed.planResult || '',
          chatSessions: [
            {
              id: sessionId,
              title: getSessionTitle(messages),
              messages,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          activeSessionId: sessionId,
        };
      }
      if (Array.isArray(parsed.chatSessions)) {
        parsed.chatSessions = parsed.chatSessions.map((s) => ({
          ...s,
          messages: s.messages.map((msg, idx) =>
            msg.id ? msg : { ...msg, id: `legacy-${idx}-${Date.now().toString(36)}` }
          ),
        }));
      }
      return parsed;
    }
  } catch {
    // ignore parse error
  }
  return { analysisResult: '', planResult: '', chatSessions: [], activeSessionId: null };
}

function saveToStorage(storageKey: string, data: StoredData) {
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.warn('[ResultContext] Data too large, trimming old sessions...');
      const sessions = data.chatSessions || [];
      if (sessions.length > 1) {
        const trimmed = {
          ...data,
          chatSessions: sessions.slice(-5).map((s) => ({
            ...s,
            messages: trimChatMessages(s.messages, MAX_STORAGE_SIZE / 10),
          })),
        };
        localStorage.setItem(storageKey, JSON.stringify(trimmed));
        return;
      }
    }
    localStorage.setItem(storageKey, serialized);
  } catch {
    console.error('[ResultContext] Failed to save to localStorage');
  }
}

export function ResultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = useMemo(() => user?.id || getAnonymousId(), [user?.id]);
  const STORAGE_KEY = useMemo(() => `health_project_results_${userId}`, [userId]);

  const initial = loadFromStorage(STORAGE_KEY);
  const [analysisResult, setAnalysisResultState] = useState(initial.analysisResult);
  const [planResult, setPlanResultState] = useState(initial.planResult);
  const [chatSessions, setChatSessionsState] = useState<ChatSession[]>(initial.chatSessions || []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initial.activeSessionId || null);
  const activeSessionIdRef = useRef(activeSessionId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const chatMessages = useMemo(() => {
    if (!activeSessionId) return [];
    const session = chatSessions.find((s) => s.id === activeSessionId);
    return session?.messages || [];
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    const data = loadFromStorage(STORAGE_KEY);
    setAnalysisResultState(data.analysisResult);
    setPlanResultState(data.planResult);
    setChatSessionsState(data.chatSessions || []);
    setActiveSessionId(data.activeSessionId || null);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(STORAGE_KEY, { analysisResult, planResult, chatSessions, activeSessionId });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [analysisResult, planResult, chatSessions, activeSessionId, STORAGE_KEY]);

  const setAnalysisResult = (result: string) => {
    setAnalysisResultState(result);
  };

  const setPlanResult = (result: string) => {
    setPlanResultState(result);
  };

  const setChatMessages = (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const currentId = activeSessionIdRef.current;
    if (!currentId) return;
    setChatSessionsState((prev) => {
      return prev.map((s) => {
        if (s.id !== currentId) return s;
        const newMessages = typeof messages === 'function' ? messages(s.messages) : messages;
        const title = s.title === '新对话' && newMessages.length > 0 ? getSessionTitle(newMessages) : s.title;
        return { ...s, messages: newMessages, title, updatedAt: Date.now() };
      });
    });
  };

  const createChatSession = useCallback(() => {
    const id = generateId();
    const newSession: ChatSession = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChatSessionsState((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    return id;
  }, []);

  const switchChatSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const deleteChatSession = useCallback((id: string) => {
    setChatSessionsState((prev) => prev.filter((s) => s.id !== id));
    setActiveSessionId((prev) => (prev === id ? null : prev));
  }, []);

  const renameChatSession = useCallback((id: string, title: string) => {
    setChatSessionsState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  }, []);

  const clearResults = () => {
    setAnalysisResultState('');
    setPlanResultState('');
    setChatSessionsState([]);
    setActiveSessionId(null);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ResultContext.Provider
      value={{
        analysisResult,
        setAnalysisResult,
        planResult,
        setPlanResult,
        chatMessages,
        setChatMessages,
        chatSessions,
        activeSessionId,
        createChatSession,
        switchChatSession,
        deleteChatSession,
        renameChatSession,
        clearResults,
      }}
    >
      {children}
    </ResultContext.Provider>
  );
}


