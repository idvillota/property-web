import { useQueryClient } from '@tanstack/react-query'

export function useInvalidate(keys: string[]) {
  const queryClient = useQueryClient()
  return () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}
