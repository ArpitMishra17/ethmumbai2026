import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.insuredAgent.findMany();
  console.log("Agents in DB:", agents);
}

main();
