import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../database";
import { OrganizationService } from "../services/organization.service";
import { UserService } from "../services/user.service";

describe("Database Tests", () => {
  const organizationService = new OrganizationService();
  const userService = new UserService();

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.organization.deleteMany({
      where: { orgId: { startsWith: "fern-test-" } },
    });
    await prisma.user.deleteMany({
      where: { userId: { startsWith: "fern-test-" } },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.organization.deleteMany({
      where: { orgId: { startsWith: "fern-test-" } },
    });
    await prisma.user.deleteMany({
      where: { userId: { startsWith: "fern-test-" } },
    });
    await prisma.$disconnect();
  });

  it("should create and retrieve a user", async () => {
    const testUserId = "fern-test-user-1";
    const testEmail = "fern-test-user-1@example.com";

    // Create user
    const createdUser = await userService.createUser({
      userId: testUserId,
      email: testEmail,
      githubUsername: "fern-test-github-user",
      isAdmin: false,
    });
    expect(createdUser.userId).toBe(testUserId);
    expect(createdUser.email).toBe(testEmail);
    expect(createdUser.githubUsername).toBe("fern-test-github-user");

    // Retrieve user
    const retrievedUser = await userService.getUser(testUserId);
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.userId).toBe(testUserId);
    expect(retrievedUser?.email).toBe(testEmail);
  });

  it("should update user's GitHub username", async () => {
    const testUserId = "fern-test-user-2";
    const testEmail = "fern-test-user-2@example.com";

    // Create user without GitHub username
    const createdUser = await userService.createUser({
      userId: testUserId,
      email: testEmail,
      isAdmin: false,
    });
    expect(createdUser.githubUsername).toBeNull();

    // Update user with GitHub username
    const updatedUser = await userService.updateUser(testUserId, {
      githubUsername: "updated-github-user",
    });
    expect(updatedUser.githubUsername).toBe("updated-github-user");
  });

  it("should return null for non-existent user", async () => {
    const nonExistentUser = await userService.getUser("non-existent");
    expect(nonExistentUser).toBeNull();
  });

  it("should create and retrieve an organization", async () => {
    const testOrgId = "fern-test-org-1";

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
