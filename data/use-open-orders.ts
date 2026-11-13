import { useCallback, useEffect, useState } from 'react';
import { getSavedOrderStore } from './client';
import type { SavedOrder } from './saved-order-types';

export function useOpenOrders() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    void (async () => {
      try {
        const saved = await (await getSavedOrderStore()).list();
        if (!cancelled) setOrders(saved);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [revision]);
  return { orders, loading, error, refresh };
}
