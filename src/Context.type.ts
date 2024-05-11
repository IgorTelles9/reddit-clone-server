export type Context = {
    prisma: import("@prisma/client").PrismaClient;
    req: any;
}