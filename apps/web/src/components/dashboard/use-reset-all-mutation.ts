import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useResetAllMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/reset', { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`failed to reset all test data: ${response.status} ${response.statusText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}
