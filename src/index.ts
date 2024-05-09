import express from 'express';
import { PrismaClient } from "@prisma/client"

const app = express();
const prisma = new PrismaClient();
const port = 3000;

const main = async () => {
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
    })

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});