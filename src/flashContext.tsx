import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type FlashTone = 'success' | 'error' | 'info';

type FlashItem = {
  id: number;
  message: string;
  tone: FlashTone;
};

type FlashApi = {
  show: (message: string, tone?: FlashTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

type FlashContextValue = FlashApi & {
  current: FlashItem | null;
  dismiss: () => void;
};

const FlashContext = createContext<FlashContextValue | null>(null);

const DISMISS_MS = 3500;

export function FlashProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<FlashItem | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  }, []);

  const show = useCallback(
    (message: string, tone: FlashTone = 'success') => {
      const trimmed = message.trim();
      if (!trimmed) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      idRef.current += 1;
      setCurrent({ id: idRef.current, message: trimmed, tone });
      timerRef.current = setTimeout(dismiss, DISMISS_MS);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const value = useMemo(
    (): FlashContextValue => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
      dismiss,
      current,
    }),
    [show, dismiss, current],
  );

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export function useFlash(): FlashApi {
  const ctx = useContext(FlashContext);
  if (!ctx) {
    throw new Error('useFlash must be used within FlashProvider');
  }
  return useMemo(
    () => ({
      show: ctx.show,
      success: ctx.success,
      error: ctx.error,
      info: ctx.info,
    }),
    [ctx.show, ctx.success, ctx.error, ctx.info],
  );
}

export function useFlashState() {
  const ctx = useContext(FlashContext);
  if (!ctx) {
    throw new Error('useFlashState must be used within FlashProvider');
  }
  return { current: ctx.current, dismiss: ctx.dismiss };
}
