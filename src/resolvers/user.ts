import { Arg, Ctx, Mutation, Resolver, Query } from "type-graphql";
import { Context } from "../context";
import { UserResponse } from "../types/user";
import { FieldError } from "../types/error";
import { User } from "@generated/type-graphql/models/User";
import validator from "validator";
const argon2 = require("argon2");
import { v4 } from "uuid";
import { sendMail } from "../utils/sendMail";

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, prisma }: Context): Promise<User | null> {
        const userId = req.session!.userId;
        if (!userId) return null;
        return await prisma.user.findUnique({ where: { id: userId } });
    }

    @Mutation(() => UserResponse)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Arg("email") email: string,
        @Ctx() { prisma, req }: Context,
    ): Promise<UserResponse> {
        if (username.length < 3) return { errors: [getUsernameTooShortError()] };

        if (password.length < 6) return { errors: [getPasswordTooShortError()] };

        if (!validator.isEmail(email)) return { errors: [getInvalidEmailError()] };

        const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
        });
        if (existingUser) return { errors: [getUsernameNotAvailableError()] };

        const hashedPassword = await argon2.hash(password);
        const newUser = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        });
        req.session!.userId = newUser.id;
        return { user: newUser };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req, prisma }: Context,
    ): Promise<UserResponse> {
        const searchCriteria = getSearchCriteria(usernameOrEmail);
        const user = await prisma.user.findUnique({ where: searchCriteria as any });
        if (user && (await argon2.verify(user.password, password))) {
            req.session!.userId = user.id;
            return { user };
        }
        return { errors: [getUsernameEmailIncorrectError(), getPasswordIncorrectError()] };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: Context): Promise<boolean> {
        return new Promise((resolve) =>
            req.session!.destroy((err) => {
                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }
                res.clearCookie("qid");
                resolve(true);
            }),
        );
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Ctx() { prisma, redis }: Context,
    ): Promise<boolean> {
        const searchCriteria = getSearchCriteria(usernameOrEmail);
        const user = await prisma.user.findUnique({ where: searchCriteria as any });
        if (!user) return true;
        const token = v4();
        await redis.set(process.env.REDIS_PASSWORD_PREFIX + token, user.id, "ex", 1000 * 60 * 30);
        const text = `<a href="${process.env.FRONT_URL}/change-password/${token}">reset your password</a>`;
        await sendMail(user.email, text);
        return true;
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("password") password: string,
        @Ctx() { prisma, redis, req }: Context,
    ) {
        const userId = await redis.get(process.env.REDIS_PASSWORD_PREFIX + token);
        if (!userId) return { errors: [getChangePasswordError()] };
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { errors: [getUserNotFoundError()] };

        const hashedPassword = await argon2.hash(password);
        if (password.length < 6) return { errors: [getPasswordTooShortError()] };
        await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
        req.session!.userId = user.id;
        await redis.del(process.env.REDIS_PASSWORD_PREFIX + token);
        return { user };
    }
}

const getSearchCriteria = (usernameOrEmail: string): { username?: string; email?: string } => {
    if (validator.isEmail(usernameOrEmail)) return { email: usernameOrEmail };
    return { username: usernameOrEmail };
};

const getUsernameNotAvailableError = (): FieldError => {
    return {
        field: "username",
        message: "Username not available",
    };
};

const getUsernameTooShortError = (): FieldError => {
    return {
        field: "username",
        message: "Username's too short",
    };
};

const getPasswordTooShortError = (): FieldError => {
    return {
        field: "password",
        message: "Password's too short",
    };
};

const getInvalidEmailError = (): FieldError => {
    return {
        field: "email",
        message: "Invalid email",
    };
};

const getUsernameEmailIncorrectError = (): FieldError => {
    return {
        field: "usernameOrEmail",
        message: "Username/Email incorrect",
    };
};

const getPasswordIncorrectError = (): FieldError => {
    return {
        field: "password",
        message: "Password incorrect",
    };
};

const getChangePasswordError = (): FieldError => {
    return {
        field: "token",
        message: "This change password url has expired.",
    };
};

const getUserNotFoundError = (): FieldError => {
    return {
        field: "user",
        message: "User not found",
    };
};
