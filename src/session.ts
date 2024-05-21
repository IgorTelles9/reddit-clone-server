import RedisStore from "connect-redis"
import session from "express-session";
import { createClient } from 'redis';

export const getRedisClient = () => createClient({
        url: 'redis://localhost:6360'
    });

export const getSession = (redisClient: any) => {
    redisClient.connect().catch(console.error);
    return session({
        name: "qid",
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
            httpOnly: true,
            sameSite: "lax",
        },

    })
}