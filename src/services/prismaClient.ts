import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated";

// 1. Initialize the pool and adapter first
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Pass the adapter into PrismaClient
export const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`;
        },
      },
      image: {
        needs: { image: true },
        compute(user) {
          if (user.image) {
            return "/optimize/" + user.image.split(".")[0] + ".webp";
          }
          return user.image;
        },
      },
    },

    post: {
      image: {
        needs: { image: true },
        compute(post) {
          if (post.image) {
            return "/optimize/" + post.image.split(".")[0] + ".webp";
          }
          return post.image;
        },
      },
      updatedAt: {
        needs: { updatedAt: true },
        compute(post) {
          return post.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
  },
});
