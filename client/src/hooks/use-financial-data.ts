import { useQuery } from "@tanstack/react-query";

export function useFinancialData(userId: number) {
  return useQuery({
    queryKey: [`/api/dashboard/${userId}`],
    enabled: !!userId,
  });
}
