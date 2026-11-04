import { PrismaClient } from "../generated";

const prisma = new PrismaClient();

export type PostArgs = {
  title: string;
  content: string;
  body: string;
  image: string;
  authorId: number;
  category: string;
  type: string;
  tags?: string[]; // Made optional for flexibility
};

export const createPost = async (postData: PostArgs) => {
  // Build the base data object
  let data: any = {
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

  // Conditionally add tags outside the object literal
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
