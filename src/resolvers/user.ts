import { Arg, Ctx, Mutation, Resolver, Query } from "type-graphql";
import { Context } from "../context";
import { UserResponse } from "../types/user";
import { FieldError } from "../types/error";
import { User } from "@generated/type-graphql/models/User";
const argon2 = require('argon2');

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, prisma }: Context
    ): Promise<User | null> {
        const userId = req.session!.userId;
        if (!userId) return null;
        return await prisma.user.findUnique({ where: { id: userId } });
    }

    @Mutation(() => UserResponse)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { prisma }: Context
    ): Promise<UserResponse> {
        if (username.length < 3)
            return { errors: [getUsernameTooShortError()] };

        const existingUser = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
        if (existingUser)
            return { errors: [getUsernameNotAvailableError()] };

        const hashedPassword = await argon2.hash(password);
        const newUser = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                password: hashedPassword
            }
        });
        return { user: newUser };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { req, prisma }: Context
    ): Promise<UserResponse> {
        const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
        if (user && await argon2.verify(user.password, password)) {
            req.session!.userId = user.id;
            return { user };
        }
        return { errors: [getUsernameIncorrectError(), getPasswordIncorrectError()] };
    }
}

const getUsernameNotAvailableError = (): FieldError => {
    return {
        field: 'username',
        message: 'Username not available'
    };
}

const getUsernameTooShortError = (): FieldError => {
    return {
        field: 'username',
        message: 'Username too short'
    };
}

const getUsernameIncorrectError = (): FieldError => {
    return {
        field: 'username',
        message: 'Username incorrect'
    };
}

const getPasswordIncorrectError = (): FieldError => {
    return {
        field: 'password',
        message: 'Password incorrect'
    };
}