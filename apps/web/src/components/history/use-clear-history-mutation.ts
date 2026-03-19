import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

type DeleteHistoryResponse = {
    deleted: {
        fills: number;
        quotes: number;
        inventory: number;
        pnlSnapshots: number;
    };
};

interface UseClearHistoryMutationProps {
    setFillsPage: Dispatch<SetStateAction<number>>;
    setPnlPage: Dispatch<SetStateAction<number>>;
    setInventoryPage: Dispatch<SetStateAction<number>>;
}

export function useClearHistoryMutation({
    setFillsPage,
    setPnlPage,
    setInventoryPage,
}: UseClearHistoryMutationProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/history', {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('failed to delete historical data');
            }
            return (await response.json()) as DeleteHistoryResponse;
        },
        onSuccess: () => {
            setFillsPage(1);
            setPnlPage(1);
            setInventoryPage(1);
            queryClient.invalidateQueries({ queryKey: ['history', 'fills'] });
            queryClient.invalidateQueries({ queryKey: ['history', 'pnl'] });
            queryClient.invalidateQueries({
                queryKey: ['history', 'inventory'],
            });
        },
    });
}
