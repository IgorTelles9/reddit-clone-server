import { Arg, Ctx, Mutation, Resolver, Query } from "type-graphql";
import { Context } from "../context";
import { UserResponse } from "../types/user";
import { FieldError } from "../types/error";
import { User } from "@generated/type-graphql/models/User";
import validator from "validator";
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
        @Arg("email") email: string,
        @Ctx() { prisma, req }: Context
    ): Promise<UserResponse> {
        if (username.length < 3)
            return { errors: [getUsernameTooShortError()] };

        if (password.length < 6)
            return { errors: [getPasswordTooShortError()] };

        if (!validator.isEmail(email))
            return { errors: [getInvalidEmailError()] };

        const existingUser = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
        if (existingUser)
            return { errors: [getUsernameNotAvailableError()] };

        const hashedPassword = await argon2.hash(password);
        const newUser = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword
            }
        });
        req.session!.userId = newUser.id;
        return { user: newUser };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req, prisma }: Context
    ): Promise<UserResponse> {

        let searchCriteria: { username?: string, email?: string } = {};
        if (validator.isEmail(usernameOrEmail))
            searchCriteria = { email: usernameOrEmail }
        else
            searchCriteria = { username: usernameOrEmail }
        const user = await prisma.user.findUnique({ where: searchCriteria as any });
        if (user && await argon2.verify(user.password, password)) {
            req.session!.userId = user.id;
            return { user };
        }
        return { errors: [getUsernameEmailIncorrectError(), getPasswordIncorrectError()] };
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: Context
    ): Promise<boolean> {
        return new Promise((resolve) => req.session!.destroy((err) => {
            if (err) {
                console.error(err);
                resolve(false);
                return;
            }
            res.clearCookie('qid');
            resolve(true);
        }));
    }

    // @Mutation(())
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
        message: "Username's too short"
    };
}

const getPasswordTooShortError = (): FieldError => {
    return {
        field: 'password',
        message: "Password's too short"
    };
}

const getInvalidEmailError = (): FieldError => {
    return {
        field: 'email',
        message: 'Invalid email'
    };
}

const getUsernameEmailIncorrectError = (): FieldError => {
    return {
        field: 'username/email',
        message: 'Username/Email incorrect'
    };
}

const getPasswordIncorrectError = (): FieldError => {
    return {
        field: 'password',
        message: 'Password incorrect'
    };
}