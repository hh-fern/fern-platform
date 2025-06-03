// // stand up pg docker container
// // run tests
// // tear down pg docker container
// import { DashboardDao } from "../..";
// import { PrismaClient } from "../../generated/prisma";

// const prisma = new PrismaClient();

// describe("DocsWorkspaceDao", () => {
//   it("should create a workspace", async () => {
//     const dashboardDao = new DashboardDao(prisma);
//     const workspace = await dashboardDao.workspace().createWorkspace({
//       id: "1",
//       name: "Test Workspace",
//       slug: "test-workspace",
//       description: "Test Workspace Description",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//     expect(workspace).toBeDefined();
//   });
// });
