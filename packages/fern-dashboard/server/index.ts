import { UserDao } from "./daos/user";
import { WorkspaceDao } from "./daos/workspace";
import { PrismaClient } from "./generated/prisma";

export class DashboardDao {
  private workspaceDao: WorkspaceDao;
  private userDao: UserDao;
  // Add other DAOs as needed

  constructor(prisma: PrismaClient) {
    this.workspaceDao = new WorkspaceDao(prisma);
    this.userDao = new UserDao(prisma);
  }

  public workspace(): WorkspaceDao {
    return this.workspaceDao;
  }

  public user(): UserDao {
    return this.userDao;
  }
}
