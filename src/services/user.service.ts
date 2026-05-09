import prisma from "@/lib/prisma";

class UserService {
  async getUser(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
}

export const userService = new UserService();
