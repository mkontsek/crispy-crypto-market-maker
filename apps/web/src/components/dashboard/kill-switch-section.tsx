'use client';

import type { FC } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type KillSwitchSectionProps = {
  engaged: boolean;
  pending: boolean;
  onToggle: (engaged: boolean) => void;
};

export const KillSwitchSection: FC<KillSwitchSectionProps> = ({ engaged, pending, onToggle }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card className={engaged ? 'border-red-600' : ''}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide">Kill Switch</span>
            <Badge tone={engaged ? 'danger' : 'success'}>
              {engaged ? 'ENGAGED — all quoting halted' : 'DISENGAGED'}
            </Badge>
          </div>
          <Button
            variant={engaged ? 'outline' : 'danger'}
            disabled={pending}
            onClick={() => (engaged ? onToggle(false) : setConfirmOpen(true))}
          >
            {pending ? 'Applying…' : engaged ? 'Disengage Kill Switch' : 'Engage Kill Switch'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogHeader>
          <DialogTitle>Confirm Kill Switch</DialogTitle>
          <button
            onClick={() => setConfirmOpen(false)}
            className="text-slate-400 transition hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </DialogHeader>
        <DialogContent>
          <p>
            Engaging the kill switch will immediately{' '}
            <strong className="text-red-300">pause all quoting</strong> across every pair.
            No new orders will be placed until the kill switch is disengaged.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false);
                onToggle(true);
              }}
            >
              Engage Kill Switch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
