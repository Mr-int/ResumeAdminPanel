import { useEffect } from 'react';

/**
 * Запускает эффект с AbortSignal; при смене deps или размонтировании отменяет запрос.
 * @param {(signal: AbortSignal, isActive: () => boolean) => void | Promise<void>} effect
 * @param {unknown[]} deps
 */
export function useEffectWithAbort(effect, deps) {
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const isActive = () => active;

    void effect(controller.signal, isActive);

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
