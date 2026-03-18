import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const DEFAULT_DATABASE_URL =
    'postgresql://postgres:postgres@localhost:55432/postgres';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    },
});
