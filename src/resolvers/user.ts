import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { User } from "@generated/type-graphql/models/User";
import { Context } from "../Context.type";
const argon2 = require('argon2');

@Resolver()
export class UserResolver {
    @Mutation(() => User)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { prisma }: Context
    ): Promise<User> {
        const hashedPassword = await argon2.hash(password);
        return await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                password: hashedPassword
            }
        });
    }

    // @Mutation
}