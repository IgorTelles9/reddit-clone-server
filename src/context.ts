export type Context = {
    prisma: import("@prisma/client").PrismaClient;
    req: Express.Request
    res: Express.Response;

}
