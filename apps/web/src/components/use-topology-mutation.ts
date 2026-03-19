import type { RuntimeTopology } from '@crispy/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

import { saveTopologyToStorage } from '@/lib/topology-storage';

interface UseTopologyMutationProps {
    setSelectedBotId: Dispatch<SetStateAction<string | null>>;
}

export function useTopologyMutation({
    setSelectedBotId,
}: UseTopologyMutationProps) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: RuntimeTopology) => {
            const response = await fetch('/api/topology', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('failed to update topology');
            }
            return (await response.json()) as RuntimeTopology;
        },
        onSuccess: (updatedTopology) => {
            saveTopologyToStorage(updatedTopology);

            const previousTopology = queryClient.getQueryData<RuntimeTopology>([
                'topology',
            ]);

            queryClient.setQueryData(['topology'], updatedTopology);

            setSelectedBotId((current) => {
                if (
                    current &&
                    previousTopology &&
                    updatedTopology.bots.length > previousTopology.bots.length
                ) {
                    return (
                        updatedTopology.bots[updatedTopology.bots.length - 1]
                            ?.id ?? current
                    );
                }
                return current &&
                    updatedTopology.bots.some((bot) => bot.id === current)
                    ? current
                    : (updatedTopology.bots[0]?.id ?? null);
            });

            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['fills'] });
            queryClient.invalidateQueries({ queryKey: ['pnl'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
