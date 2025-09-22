import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export function useApiData<T>(url: string | null, options?: { revalidateOnFocus?: boolean }) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache por 2 segundos
      ...options
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate // Para invalidar cache
  };
}

// Hook específico para lookups
export function useLookupData<T>(endpoint: string, enabled = true) {
  return useApiData<T>(
    enabled ? `/api/lookups/${endpoint}` : null,
    { revalidateOnFocus: false }
  );
}