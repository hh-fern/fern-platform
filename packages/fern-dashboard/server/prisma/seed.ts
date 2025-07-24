import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  console.log("Cleaning up existing data...");
  await prisma.feedback.deleteMany();
  await prisma.docsInstance.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { userId: "user-1" },
    update: {},
    create: {
      userId: "user-1",
      isAdmin: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { userId: "user-2" },
    update: {},
    create: {
      userId: "user-2",
      isAdmin: false,
    },
  });

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

  // Create user-organization relationships
  const userOrg1 = await prisma.userOrganization.upsert({
    where: { userId_orgId: { userId: "user-1", orgId: "org-1" } },
    update: {},
    create: {
      userId: "user-1",
      orgId: "org-1",
    },
  });

  const userOrg2 = await prisma.userOrganization.upsert({
    where: { userId_orgId: { userId: "user-1", orgId: "org-2" } },
    update: {},
    create: {
      userId: "user-1",
      orgId: "org-2",
    },
  });

  const userOrg3 = await prisma.userOrganization.upsert({
    where: { userId_orgId: { userId: "user-2", orgId: "org-1" } },
    update: {},
    create: {
      userId: "user-2",
      orgId: "org-1",
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

  // Create sample feedback linked to docs instances
  const feedback1 = await prisma.feedback.create({
    data: {
      pageUrl: "/getting-started",
      sessionId: "session-1",
      eventId: "event-feedback-1",
      location: "US",
      deviceType: "desktop",
      browser: "Chrome",
      isHelpful: true,
      selection: "helpful",
      comment: "Great documentation!",
      email: "user@example.com",
      docsInstanceId: "docs-1",
    },
  });

  const feedback2 = await prisma.feedback.create({
    data: {
      pageUrl: "/api-reference",
      sessionId: "session-2",
      eventId: "event-feedback-2",
      location: "CA",
      deviceType: "mobile",
      browser: "Safari",
      isHelpful: false,
      selection: "not-helpful",
      comment: "Could use more examples",
      email: "developer@example.com",
      docsInstanceId: "docs-1",
    },
  });

  const feedback3 = await prisma.feedback.create({
    data: {
      pageUrl: "/tutorials",
      sessionId: "session-3",
      eventId: "event-feedback-3",
      location: "UK",
      deviceType: "tablet",
      browser: "Firefox",
      isHelpful: true,
      selection: "helpful",
      comment: "Very clear tutorials!",
      email: "learner@example.com",
      docsInstanceId: "docs-2",
    },
  });

  console.log("Database seeded successfully");
  console.log({
    user1,
    user2,
    org1,
    org2,
    userOrg1,
    userOrg2,
    userOrg3,
    docsInstance1,
    docsInstance2,
    feedback1,
    feedback2,
    feedback3,
  });
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(console.error);
  });
