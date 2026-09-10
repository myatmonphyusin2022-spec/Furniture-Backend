import { PrismaClient, Prisma } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import * as bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// သင့် ကုတ်မူရင်းအတိုင်း array ထဲတွင် password ကို "" အဖြစ်ထားရှိခြင်း
const userData: Prisma.UserCreateInput[] = [
  {
    phone: "+959778661260",
    password: "",
    randToken: "sfwfx23rbkxg982ntxf87",
  },
  {
    phone: "+959778661261",
    password: "",
    randToken: "sfwfx23rbkxg982ntxf87",
  },
  {
    phone: "+959778661262",
    password: "",
    randToken: "sfwfx23rbkxg982ntxf87",
  },
  {
    phone: "+959778661263",
    password: "",
    randToken: "sfwfx23rbkxg982ntxf87",
  },
  {
    phone: "+959778661264",
    password: "",
    randToken: "sfwfx23rbkxg982ntxf87",
  },
];

async function main() {
  console.log(`Start seeding ...`);
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash("12345678", salt);

  for (const u of userData) {
    u.password = password; // bcrypt hash လုပ်ထားသော password ဖြင့် အစားထိုးခြင်း
    await prisma.user.create({
      data: {
        phone: u.phone,
        password: u.password,
        randToken: u.randToken,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
