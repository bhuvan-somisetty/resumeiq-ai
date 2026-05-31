/**
 * Prisma seed — minimal demo data for local development.
 * Run with: npm run prisma:seed
 */
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkId: "seed_user_local" },
    update: {},
    create: {
      clerkId: "seed_user_local",
      email: "demo@resumeiq.ai",
      name: "Demo User",
      plan: "PRO",
    },
  });

  console.log(`Seeded user: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
