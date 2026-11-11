import { prisma } from "./prismaClient";

export const createOneProduct = async (data: any) => {
  try {
    // Safely parse numbers with fallbacks to prevent NaN crashes
    const productdata: any = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price) || 0,
      discount: parseFloat(data.discount) || 0,
      inventory: parseInt(data.inventory, 10) || 0,
    };

    // Safely connect or create category
    if (data.category) {
      productdata.category = {
        connectOrCreate: {
          where: { name: data.category },
          create: { name: data.category },
        },
      };
    }

    // Safely connect or create type
    if (data.type) {
      productdata.type = {
        connectOrCreate: {
          where: { name: data.type },
          create: { name: data.type },
        },
      };
    }

    // Safely map images using only 'path' (since schema doesn't have 'filename')
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      productdata.images = {
        create: data.images.map((img: any) => {
          const fileName =
            typeof img === "string" ? img : img.filename || "default.jpg";
          return {
            path: `/uploads/images/${fileName}`, // Schema uses 'path', not 'filename'
          };
        }),
      };
    }

    // Safely map tags (prevents crash if tags array is empty or missing)
    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      productdata.tags = {
        connectOrCreate: data.tags.map((tagName: string) => ({
          where: { name: tagName },
          create: { name: tagName },
        })),
      };
    }

    // Execute Prisma create
    const newProduct = await prisma.product.create({
      data: productdata,
      include: {
        images: true,
        category: true,
        type: true,
      },
    });

    return newProduct;
  } catch (error: any) {
    console.error(
      "Prisma Error in createOneProduct:",
      error.message || error,
    );
    throw error;
  }
};

export const getProductById = async (id: number) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      category: true,
      type: true,
    },
  });
};
