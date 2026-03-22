import { useRef, useCallback, useEffect } from 'react';

/** Tipo do retorno: mesma assinatura da callback + método cancel() */
type DebouncedFn<T extends (...args: never[]) => void> = T & { cancel: () => void };

/**
 * Retorna uma versão debounced da callback.
 * A callback é invocada após `delay` ms de inatividade.
 * A função retornada é estável (mesma referência entre renders).
 * Possui `.cancel()` para cancelar execução pendente (ex: save manual).
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): DebouncedFn<T> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Mantém sempre a callback mais recente
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay],
  );

  // Método para cancelar execução pendente
  (debounced as DebouncedFn<T>).cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return debounced as DebouncedFn<T>;
}
