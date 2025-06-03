import { DocsWorkspace, PrismaClient } from "../generated/prisma";

export class DocsWorkspaceDao {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createWorkspace(workspace: DocsWorkspace) {
    await this.prisma.docsWorkspace.create({
      data: workspace,
    });
  }
}
