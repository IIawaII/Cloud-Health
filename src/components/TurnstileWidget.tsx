import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  siteKey: string;
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  siteKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const SCRIPT_ID = 'turnstile-script';
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const initWidget = () => {
      if (cancelled) return;
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme: 'light',
          size: 'normal',
        });
      } else {
        // window.turnstile 尚未就绪（脚本还在加载中），100ms 后重试
        retryTimer = setTimeout(initWidget, 100);
      }
    };

    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = SCRIPT_ID;
      newScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      newScript.async = true;
      newScript.onload = initWidget;
      document.head.appendChild(newScript);
    } else {
      // 脚本已存在（可能在 index.html 中预加载或由其他页面加载）
      // 直接尝试初始化，如果 turnstile API 还没就绪会自动轮询
      initWidget();
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onError, onExpire, siteKey]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center"
      data-turnstile-widget
    />
  );
}

export function resetTurnstile() {
  if (typeof window !== 'undefined' && window.turnstile) {
    // 重置所有 Turnstile 组件
    const widgets = document.querySelectorAll('[data-turnstile-widget]');
    widgets.forEach((widget) => {
      const widgetId = widget.getAttribute('data-turnstile-widget-id');
      if (widgetId) {
        window.turnstile?.reset(widgetId);
      }
    });
  }
}
