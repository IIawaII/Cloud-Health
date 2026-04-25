import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { ChatMessage } from '../types';
import { getAnonymousId } from '@/lib/anonymousId';
import { trimChatMessages } from '@/lib/trimMessages';

interface ResultContextType {
  analysisResult: string;
  setAnalysisResult: (result: string) => void;
  planResult: string;
  setPlanResult: (result: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  clearResults: () => void;
}

const ResultContext = createContext<ResultContextType | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 800;
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB 预警阈值

function loadFromStorage(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      return JSON.parse(raw) as { analysisResult: string; planResult: string; chatMessages: ChatMessage[] };
    }
  } catch {
    // ignore parse error
  }
  return { analysisResult: '', planResult: '', chatMessages: [] };
}

function saveToStorage(storageKey: string, data: { analysisResult: string; planResult: string; chatMessages: ChatMessage[] }) {
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.warn('[ResultContext] Data too large, trimming old messages...');
      const trimmed = {
        ...data,
        chatMessages: trimChatMessages(data.chatMessages, MAX_STORAGE_SIZE / 2),
      };
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
      return;
    }
    localStorage.setItem(storageKey, serialized);
  } catch {
    // ignore storage error (e.g. quota exceeded)
    console.error('[ResultContext] Failed to save to localStorage');
  }
}

export function ResultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // 已登录用户按 user.id 隔离数据；匿名用户使用独立生成的匿名 ID 隔离，避免相互覆盖
  const userId = user?.id || getAnonymousId();
  const STORAGE_KEY = `health_project_results_${userId}`;

  const initial = loadFromStorage(STORAGE_KEY);
  const [analysisResult, setAnalysisResultState] = useState(initial.analysisResult);
  const [planResult, setPlanResultState] = useState(initial.planResult);
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>(initial.chatMessages);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当用户切换时，重新加载该用户对应的本地数据
  useEffect(() => {
    const data = loadFromStorage(STORAGE_KEY);
    setAnalysisResultState(data.analysisResult);
    setPlanResultState(data.planResult);
    setChatMessagesState(data.chatMessages);
  }, [STORAGE_KEY]);

  // 防抖写入 localStorage，避免频繁状态更新导致性能问题
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(STORAGE_KEY, { analysisResult, planResult, chatMessages });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [analysisResult, planResult, chatMessages, STORAGE_KEY]);

  const setAnalysisResult = (result: string) => {
    setAnalysisResultState(result);
  };

  const setPlanResult = (result: string) => {
    setPlanResultState(result);
  };

  const setChatMessages = (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof messages === 'function') {
      setChatMessagesState((prev) => messages(prev));
    } else {
      setChatMessagesState(messages);
    }
  };

  const clearResults = () => {
    setAnalysisResultState('');
    setPlanResultState('');
    setChatMessagesState([]);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ResultContext.Provider value={{ analysisResult, setAnalysisResult, planResult, setPlanResult, chatMessages, setChatMessages, clearResults }}>
      {children}
    </ResultContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResult() {
  const context = useContext(ResultContext);
  if (context === undefined) {
    throw new Error('useResult must be used within a ResultProvider');
  }
  return context;
}
