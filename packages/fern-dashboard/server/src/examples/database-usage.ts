// Example: How to use the database services in your application
import { prisma } from "../database";
import { DocsInstanceService } from "../services/docs-instance.service";
import { OrganizationService } from "../services/organization.service";

// Example: Creating and managing organizations
async function organizationExample() {
  const orgService = new OrganizationService();

  // Create a new organization
  const newOrg = await orgService.createOrganization("my-org-123");
  console.log("Created organization:", newOrg);

  // Get organization by ID
  const org = await orgService.getOrganization("my-org-123");
  console.log("Retrieved organization:", org);

  // Get all organizations
  const allOrgs = await orgService.getAllOrganizations();
  console.log("All organizations:", allOrgs);
}

// Example: Managing docs instances
async function docsInstanceExample() {
  const docsService = new DocsInstanceService();

  // Create a new docs instance
  const newDocs = await docsService.createDocsInstance({
    id: "docs-123",
    orgId: "my-org-123",
    url: "https://docs.mycompany.com",
  });
  console.log("Created docs instance:", newDocs);

  // Get docs instance by organization
  const docs = await docsService.getDocsInstanceByOrgId("my-org-123");
  console.log("Docs instance for org:", docs);

  // Update docs instance
  const updatedDocs = await docsService.updateDocsInstance("docs-123", {
    url: "https://new-docs.mycompany.com",
  });
  console.log("Updated docs instance:", updatedDocs);
}

// Example: Direct Prisma queries
async function directPrismaExample() {
  // Create feedback
  const feedback = await prisma.feedback.create({
    data: {
      pageUrl: "/getting-started",
      sessionId: "session-123",
      eventId: "event-456",
      location: "US",
      deviceType: "desktop",
      browser: "Chrome",
      isHelpful: true,
      selection: "helpful",
      comment: "Great documentation!",
      email: "user@example.com",
    },
  });
  console.log("Created feedback:", feedback);

  // Query feedback with filters
  const helpfulFeedback = await prisma.feedback.findMany({
    where: {
      isHelpful: true,
      votedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: {
      votedAt: "desc",
    },
  });
  console.log("Helpful feedback from last 7 days:", helpfulFeedback);

  // Aggregate feedback
  const feedbackStats = await prisma.feedback.groupBy({
    by: ["isHelpful"],
    _count: {
      id: true,
    },
  });
  console.log("Feedback statistics:", feedbackStats);
}

// Example: Transaction example
async function transactionExample() {
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const org = await tx.organization.create({
      data: { orgId: "transaction-org" },
    });

    // Create docs instance for the organization
    const docs = await tx.docsInstance.create({
      data: {
        id: "transaction-docs",
        orgId: org.orgId,
        url: "https://docs.transaction.com",
      },
    });

    return { org, docs };
  });

  console.log("Transaction result:", result);
}

// Export examples for use in other parts of the application
export {
  organizationExample,
  docsInstanceExample,
  directPrismaExample,
  transactionExample,
};
