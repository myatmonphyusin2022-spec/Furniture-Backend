import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getSettingStatus = async (key: string) => {
  return prisma.setting.findUnique({
    where: { key },
  });
};

export const createOrUpdateSettingStatus = async (
  key: string,
  value: string,
) => {
  return prisma.setting.upsert({
    where: { key },
    update: {
      value,
    },
    create: {
      key,
      value,
    },
  });
};
