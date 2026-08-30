import useSWR from "swr";
import { api } from "@/lib/api";

/**
 * Hook to fetch memory data for the authenticated user
 * Handles data fetching with SWR, including error handling and logging
 */
export function useMemoryData() {
  const { data, error, isLoading } = useSWR(
    "/memories",
    () => api.getMemories().catch((err) => {
      console.warn("Could not connect to memory backend:", err);
      return { nodes: [], links: [] };
    }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      onError: (err) => {
        console.error('SWR error:', err);
      },
      onSuccess: (data) => {
        console.log('SWR success:', { nodes: data.nodes?.length, links: data.links?.length });
      }
    }
  );

  return {
    data,
    error,
    isLoading,
    hasData: !!data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0,
  };
}
