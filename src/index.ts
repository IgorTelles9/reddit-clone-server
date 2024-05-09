import "reflect-metadata";
import express from 'express';
import { PrismaClient } from "@prisma/client"
import { ApolloServer } from "apollo-server-express";
import { resolvers } from "@generated/type-graphql";
import { buildSchema } from 'type-graphql';

const app = express();
const prisma = new PrismaClient();

const main = async () => {
    const port = process.env.PORT || 4000;

    const schema = await buildSchema({
        resolvers,
        validate: false
    })
    const apollo = new ApolloServer({
        schema,
        context: ({ req }) => {
            return { prisma, req }
        }
    });
    await apollo.start();
    apollo.applyMiddleware({ app: app as any });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}


main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
    });
