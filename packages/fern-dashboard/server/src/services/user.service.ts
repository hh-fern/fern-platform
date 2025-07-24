import { prisma } from "../database";

export interface CreateUserData {
  userId: string;
  email: string;
  githubUsername?: string;
  isAdmin?: boolean;
}

export interface UpdateUserData {
  email?: string;
  githubUsername?: string;
  isAdmin?: boolean;
}

export class UserService {
  async createUser(data: CreateUserData) {
    return await prisma.user.create({
      data,
    });
  }

  async getUser(userId: string) {
    return await prisma.user.findUnique({
      where: { userId },
    });
  }

  async updateUser(userId: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { userId },
      data,
    });
  }

  async getAllUsers() {
    return await prisma.user.findMany();
  }

  async deleteUser(userId: string) {
    return await prisma.user.delete({
      where: { userId },
    });
  }
}
