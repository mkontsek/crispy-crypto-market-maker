'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEMO_AUTH_COOKIE = 'crispy_demo_auth';

function resolveNextPath(rawNext: string | null) {
  if (!rawNext) {
    return '/dashboard';
  }

  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    return rawNext;
  }

  return '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const rawNext = new URLSearchParams(window.location.search).get('next');
    const nextPath = resolveNextPath(rawNext);
    document.cookie = `${DEMO_AUTH_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax`;
    router.push(nextPath);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Demo login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="demo@crispy.dev"
                className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="demo"
                className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring-2"
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-center text-xs text-slate-400">
              Fake auth only. Any values will sign in.
            </p>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link className="text-cyan-300 hover:text-cyan-200" href="/">
              Back to landing
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
