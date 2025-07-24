import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../database";
import { OrganizationService } from "../services/organization.service";

describe("Database Tests", () => {
  const organizationService = new OrganizationService();

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.organization.deleteMany({
      where: { orgId: { startsWith: "test-" } },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.organization.deleteMany({
      where: { orgId: { startsWith: "test-" } },
    });
    await prisma.$disconnect();
  });

  it("should create and retrieve an organization", async () => {
    const testOrgId = "test-org-1";

    // Create organization
    const createdOrg = await organizationService.createOrganization(testOrgId);
    expect(createdOrg.orgId).toBe(testOrgId);

    // Retrieve organization
    const retrievedOrg = await organizationService.getOrganization(testOrgId);
    expect(retrievedOrg).not.toBeNull();
    expect(retrievedOrg?.orgId).toBe(testOrgId);
  });

  it("should return null for non-existent organization", async () => {
    const nonExistentOrg =
      await organizationService.getOrganization("non-existent");
    expect(nonExistentOrg).toBeNull();
  });
});
