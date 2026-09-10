import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export const getUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: {
      phone: phone,
    },
  });
};
