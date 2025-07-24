import { PrismaClient } from "../generated/prisma";

// Use test database URL if available, otherwise fall back to main database
const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const _directUrl = process.env.TEST_DIRECT_URL || process.env.DIRECT_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log("Seeding test database...");
  console.log(`Using database URL: ${databaseUrl?.substring(0, 20)}...`);

  // Clean up existing fern-test data
  console.log("Cleaning up existing fern-test data...");
  await prisma.feedback.deleteMany({
    where: {
      OR: [
        { pageUrl: { contains: "fern-test" } },
        { sessionId: { contains: "fern-test" } },
        { eventId: { contains: "fern-test" } },
        { comment: { contains: "fern-test" } },
        { email: { contains: "fern-test" } },
      ],
    },
  });
  await prisma.docsInstance.deleteMany({
    where: {
      OR: [
        { id: { contains: "fern-test" } },
        { url: { contains: "fern-test" } },
      ],
    },
  });
  await prisma.userOrganization.deleteMany({
    where: {
      OR: [
        { userId: { contains: "fern-test" } },
        { orgId: { contains: "fern-test" } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: {
      userId: { contains: "fern-test" },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      orgId: { contains: "fern-test" },
    },
  });

  // Create sample users with fern-test prefix
  const user1 = await prisma.user.upsert({
    where: { userId: "fern-test-user-1" },
    update: {},
    create: {
      userId: "fern-test-user-1",
      isAdmin: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { userId: "fern-test-user-2" },
    update: {},
    create: {
      userId: "fern-test-user-2",
      isAdmin: false,
    },
  });

  // Create sample organizations with fern-test prefix
  const org1 = await prisma.organization.upsert({
    where: { orgId: "fern-test-org-1" },
    update: {},
    create: {
      orgId: "fern-test-org-1",
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { orgId: "fern-test-org-2" },
    update: {},
    create: {
      orgId: "fern-test-org-2",
    },
  });

  // Create user-organization relationships with fern-test prefix
  const userOrg1 = await prisma.userOrganization.upsert({
    where: {
      userId_orgId: { userId: "fern-test-user-1", orgId: "fern-test-org-1" },
    },
    update: {},
    create: {
      userId: "fern-test-user-1",
      orgId: "fern-test-org-1",
    },
  });

  const userOrg2 = await prisma.userOrganization.upsert({
    where: {
      userId_orgId: { userId: "fern-test-user-1", orgId: "fern-test-org-2" },
    },
    update: {},
    create: {
      userId: "fern-test-user-1",
      orgId: "fern-test-org-2",
    },
  });

  const userOrg3 = await prisma.userOrganization.upsert({
    where: {
      userId_orgId: { userId: "fern-test-user-2", orgId: "fern-test-org-1" },
    },
    update: {},
    create: {
      userId: "fern-test-user-2",
      orgId: "fern-test-org-1",
    },
  });

  // Create sample docs instances with fern-test prefix
  const docsInstance1 = await prisma.docsInstance.upsert({
    where: { id: "fern-test-docs-1" },
    update: {},
    create: {
      id: "fern-test-docs-1",
      orgId: "fern-test-org-1",
      url: "https://fern-test-docs.example.com",
    },
  });

  const docsInstance2 = await prisma.docsInstance.upsert({
    where: { id: "fern-test-docs-2" },
    update: {},
    create: {
      id: "fern-test-docs-2",
      orgId: "fern-test-org-2",
      url: "https://fern-test-docs2.example.com",
    },
  });

  // Create sample feedback linked to docs instances with fern-test prefix
  const feedback1 = await prisma.feedback.create({
    data: {
      pageUrl: "/fern-test-getting-started",
      sessionId: "fern-test-session-1",
      eventId: "fern-test-event-feedback-1",
      location: "US",
      deviceType: "desktop",
      browser: "Chrome",
      isHelpful: true,
      selection: "helpful",
      comment: "Great fern-test documentation!",
      email: "fern-test-user@example.com",
      docsInstanceId: "fern-test-docs-1",
    },
  });

  const feedback2 = await prisma.feedback.create({
    data: {
      pageUrl: "/fern-test-api-reference",
      sessionId: "fern-test-session-2",
      eventId: "fern-test-event-feedback-2",
      location: "CA",
      deviceType: "mobile",
      browser: "Safari",
      isHelpful: false,
      selection: "not-helpful",
      comment: "Could use more fern-test examples",
      email: "fern-test-developer@example.com",
      docsInstanceId: "fern-test-docs-1",
    },
  });

  const feedback3 = await prisma.feedback.create({
    data: {
      pageUrl: "/fern-test-tutorials",
      sessionId: "fern-test-session-3",
      eventId: "fern-test-event-feedback-3",
      location: "UK",
      deviceType: "tablet",
      browser: "Firefox",
      isHelpful: true,
      selection: "helpful",
      comment: "Very clear fern-test tutorials!",
      email: "fern-test-learner@example.com",
      docsInstanceId: "fern-test-docs-2",
    },
  });

  console.log("Test database seeded successfully");
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
