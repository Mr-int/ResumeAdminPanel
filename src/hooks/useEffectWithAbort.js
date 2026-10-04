import { useEffect } from 'react';

/**
 * Запускает эффект с флагом isActive; при смене deps или размонтировании
 * результат устаревшего запроса игнорируется (без AbortController — иначе
 * в StrictMode и при быстрой навигации список может не загрузиться).
 * @param {(signal: AbortSignal | null, isActive: () => boolean) => void | Promise<void>} effect
 * @param {unknown[]} deps
 */
export function useEffectWithAbort(effect, deps) {
  useEffect(() => {
    let active = true;
    const isActive = () => active;

    void effect(null, isActive);

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
