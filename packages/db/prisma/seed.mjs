import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:55432/postgres';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
const DEFAULT_CONFIG = {
    baseSpreadBps: 10,
    volatilityMultiplier: 1.15,
    maxInventory: 6,
    inventorySkewSensitivity: 0.35,
    quoteRefreshIntervalMs: 250,
    enabled: true,
    hedgingEnabled: true,
    hedgeThreshold: 4.5,
    hedgeExchange: 'Bybit',
};

async function main() {
    await Promise.all(
        PAIRS.map((pair) =>
            prisma.mMConfig.upsert({
                where: { pair },
                update: DEFAULT_CONFIG,
                create: {
                    pair,
                    ...DEFAULT_CONFIG,
                },
            })
        )
    );
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
