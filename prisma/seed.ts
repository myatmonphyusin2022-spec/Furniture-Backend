import {PrismaClient, Prisma} from "@prisma/client";
import * as bcrypt from "bcrypt";


const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
    {
        phone: '448024137',
        password: "",
        randomToken: "hjjjsrnsovenv",
    },
     {
        phone: '448024134',
        password: "",
        randomToken: "hjjjsrnsovenv",
    },
     {
        phone: '448024135',
        password: "",
        randomToken: "hjjjsrnsovenv",
    },
     {
        phone: '448024136',
        password: "",
        randomToken: "hjjjsrnsovenv",
    },
     {
        phone: '448024139',
        password: "",
        randomToken: "hjjjsrnsovenv",
    },
];
async function main() {
    console.log(`Start seeding ...`);
    for (const user of userData) {
        const password = await bcrypt.hash(user.phone, 10);
        user.password = password;
        await prisma.user.create({
            data: user,
        });
    }
    console.log(`Seeding finished.`);
}