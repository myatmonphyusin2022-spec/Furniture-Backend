import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated"; // Or '../generated/prisma/client'

// Initialize the PostgreSQL pool and driver adapter required by Prisma v7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export type PostArgs = {
  title: string;
  content: string;
  body: string;
  image: string;
  authorId: number;
  category: string;
  type: string;
  tags?: string[];
};

export const createOnePost = async (postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    author: {
      connect: { id: postData.authorId },
    },
    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: { name: postData.type },
      },
    },
  };

  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      })),
    };
  }

  return await prisma.post.create({ data });
};
export const getPostById = async (id: number) => {
  return prisma.post.findUnique({
    where: { id: id },
  });
};
export const updateOnePost = async (postId: number, postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,

    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: { name: postData.type },
      },
    },
  };
  if (postData.image) {
    data.image = postData.image;
  }
  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      })),
    };
  }
  return prisma.post.update({
    where: { id: postId },
    data,
  });
};
export const deleteOnePost = async (postId: number) => {
  return prisma.post.delete({
    where: { id: postId },
  });
};
export const getPostWithRelations = async (postId: number) => {
  return prisma.post.findUnique({
    where: { id: postId },
    // omit: { createdAt: true, updatedAt: true },
    select: {
      id: true,
      title: true,
      content: true,
      body: true,
      image: true,
      updatedAt: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
  });
};
