export function resolveNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return '/dashboard';
  }

  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    return rawNext;
  }

  return '/dashboard';
}
