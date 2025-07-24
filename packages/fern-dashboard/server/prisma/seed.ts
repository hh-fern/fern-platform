import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create sample organizations
  const org1 = await prisma.organization.upsert({
    where: { orgId: "org-1" },
    update: {},
    create: {
      orgId: "org-1",
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { orgId: "org-2" },
    update: {},
    create: {
      orgId: "org-2",
    },
  });

  // Create sample docs instances
  const docsInstance1 = await prisma.docsInstance.upsert({
    where: { id: "docs-1" },
    update: {},
    create: {
      id: "docs-1",
      orgId: "org-1",
      url: "https://docs.example.com",
    },
  });

  const docsInstance2 = await prisma.docsInstance.upsert({
    where: { id: "docs-2" },
    update: {},
    create: {
      id: "docs-2",
      orgId: "org-2",
      url: "https://docs2.example.com",
    },
  });

  // Create sample feedback
  const feedback1 = await prisma.feedback.create({
    data: {
      pageUrl: "/getting-started",
      sessionId: "session-1",
      eventId: "event-1",
      location: "US",
      deviceType: "desktop",
      browser: "Chrome",
      isHelpful: true,
      selection: "helpful",
      comment: "Great documentation!",
      email: "user@example.com",
    },
  });

  console.log("Database seeded successfully");
  console.log({ org1, org2, docsInstance1, docsInstance2, feedback1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
