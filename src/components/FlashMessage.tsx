import { useFlashState, type FlashTone } from '../flashContext';
import './FlashMessage.css';

const TONE_LABEL: Record<FlashTone, string> = {
  success: 'Sucesso',
  error: 'Erro',
  info: 'Informação',
};

export function FlashViewport() {
  const { current, dismiss } = useFlashState();

  if (!current) return null;

  return (
    <div className="flash-viewport" aria-live="polite" aria-atomic="true">
      <div
        key={current.id}
        className={`flash-message flash-message-${current.tone}`}
        role={current.tone === 'error' ? 'alert' : 'status'}
      >
        <span className="flash-message-icon" aria-hidden>
          {current.tone === 'success' ? '✓' : current.tone === 'error' ? '!' : 'i'}
        </span>
        <p className="flash-message-text">{current.message}</p>
        <button
          type="button"
          className="flash-message-dismiss"
          onClick={dismiss}
          aria-label={`Fechar ${TONE_LABEL[current.tone].toLowerCase()}`}
        >
          ×
        </button>
      </div>
    </div>
  );
}
