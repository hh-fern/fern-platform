import type { Organization } from "../../generated/prisma";
import { prisma } from "../database";

export class OrganizationService {
  async createOrganization(orgId: string): Promise<Organization> {
    return prisma.organization.create({
      data: { orgId },
    });
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { orgId },
    });
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return prisma.organization.findMany();
  }

  async deleteOrganization(orgId: string): Promise<Organization> {
    return prisma.organization.delete({
      where: { orgId },
    });
  }
}
