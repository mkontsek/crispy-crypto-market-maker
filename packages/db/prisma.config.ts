import { defineConfig } from 'prisma/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getDefaultDatabaseUrl(): never {
    throw new Error(
        'DATABASE_URL is not set. Add it to packages/db/.env (see .env.example).'
    );
}

const envMode =
    process.env.PRISMA_ENV === 'production' ? 'production' : 'development';
const envFiles =
    envMode === 'production'
        ? [
              resolve(process.cwd(), '.env.prod'),
              resolve(process.cwd(), '../../packages/db/.env.prod'),
              resolve(process.cwd(), '../../.env.prod'),
          ]
        : [
              resolve(process.cwd(), '.env'),
              resolve(process.cwd(), '../../packages/db/.env'),
              resolve(process.cwd(), '../../.env'),
          ];

function readEnvValueFromFile(filePath: string, key: string) {
    if (!existsSync(filePath)) return undefined;
    const content = readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const separator = line.indexOf('=');
        if (separator === -1) continue;
        const envKey = line.slice(0, separator).trim();
        if (envKey !== key) continue;
        const envValue = line.slice(separator + 1).trim();
        return envValue.replace(/^(['"])(.*)\1$/, '$2');
    }
    return undefined;
}

function resolveEnvValue(key: string) {
    if (process.env[key]) return process.env[key];
    for (const envFile of envFiles) {
        const value = readEnvValueFromFile(envFile, key);
        if (value) return value;
    }
    return undefined;
}

function expandEnvPlaceholders(input: string) {
    return input.replace(/\$\{([A-Z0-9_]+)\}/g, (match, key: string) => {
        const resolved = resolveEnvValue(key);
        return resolved ?? match;
    });
}

function resolveDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return expandEnvPlaceholders(process.env.DATABASE_URL);
    }
    for (const envFile of envFiles) {
        const value = readEnvValueFromFile(envFile, 'DATABASE_URL');
        if (value) return expandEnvPlaceholders(value);
    }
    return getDefaultDatabaseUrl();
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: resolveDatabaseUrl(),
    },
});
