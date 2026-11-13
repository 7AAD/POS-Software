import { useEffect, useState } from 'react';
import { getSalesStore } from './client';
import type { CompletedSale } from './payment-types';

export function useSales(saleId?: string) {
  const [sales, setSales] = useState<CompletedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    void (async () => {
      try {
        const store = await getSalesStore();
        const result = saleId === undefined ? await store.list() : [await store.get(saleId)];
        if (!cancelled) setSales(result);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [saleId, attempt]);
  return { sales, loading, error, retry: () => setAttempt(value => value + 1) };
}
