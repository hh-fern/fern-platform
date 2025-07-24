import type { DocsInstance } from "../../generated/prisma";
import { prisma } from "../database";

export class DocsInstanceService {
  async createDocsInstance(data: {
    id: string;
    orgId: string;
    url: string;
  }): Promise<DocsInstance> {
    return prisma.docsInstance.create({
      data,
    });
  }

  async getDocsInstance(id: string): Promise<DocsInstance | null> {
    return prisma.docsInstance.findUnique({
      where: { id },
    });
  }

  async getDocsInstanceByOrgId(orgId: string): Promise<DocsInstance[]> {
    return prisma.docsInstance.findMany({
      where: { orgId },
    });
  }

  async updateDocsInstance(
    id: string,
    data: Partial<Pick<DocsInstance, "url" | "updatedAt">>
  ): Promise<DocsInstance> {
    return prisma.docsInstance.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteDocsInstance(id: string): Promise<DocsInstance> {
    return prisma.docsInstance.delete({
      where: { id },
    });
  }

  async getAllDocsInstances(): Promise<DocsInstance[]> {
    return prisma.docsInstance.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
