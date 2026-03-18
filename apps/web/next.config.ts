import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@crispy/shared', '@crispy/db'],
    outputFileTracingRoot: path.join(process.cwd(), '../../'),
};

export default nextConfig;
