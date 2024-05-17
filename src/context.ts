import { Response, Request } from "express";
export type Context = {
    prisma: import("@prisma/client").PrismaClient;
    req: Request
    res: Response;

}
