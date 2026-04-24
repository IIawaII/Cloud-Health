import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ChatMessage } from '../types';

interface ResultContextType {
  analysisResult: string;
  setAnalysisResult: (result: string) => void;
  planResult: string;
  setPlanResult: (result: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  clearResults: () => void;
}

const ResultContext = createContext<ResultContextType | undefined>(undefined);

const STORAGE_KEY = 'health_project_results';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as { analysisResult: string; planResult: string; chatMessages: ChatMessage[] };
    }
  } catch {
    // ignore parse error
  }
  return { analysisResult: '', planResult: '', chatMessages: [] };
}

function saveToStorage(data: { analysisResult: string; planResult: string; chatMessages: ChatMessage[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage error
  }
}

export function ResultProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [analysisResult, setAnalysisResultState] = useState(initial.analysisResult);
  const [planResult, setPlanResultState] = useState(initial.planResult);
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>(initial.chatMessages);

  const setAnalysisResult = (result: string) => {
    setAnalysisResultState(result);
    saveToStorage({ analysisResult: result, planResult, chatMessages });
  };

  const setPlanResult = (result: string) => {
    setPlanResultState(result);
    saveToStorage({ analysisResult, planResult: result, chatMessages });
  };

  const setChatMessages = (messages: ChatMessage[]) => {
    setChatMessagesState(messages);
    saveToStorage({ analysisResult, planResult, chatMessages: messages });
  };

  const clearResults = () => {
    setAnalysisResultState('');
    setPlanResultState('');
    setChatMessagesState([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ResultContext.Provider value={{ analysisResult, setAnalysisResult, planResult, setPlanResult, chatMessages, setChatMessages, clearResults }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResult() {
  const context = useContext(ResultContext);
  if (context === undefined) {
    throw new Error('useResult must be used within a ResultProvider');
  }
  return context;
}
