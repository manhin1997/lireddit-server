import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "./types";
import expressPlayground from 'graphql-playground-middleware-express';
import cors from 'cors';
import { EnumGraphQL } from "./utils/EnumGraphQL";
import Redis from "ioredis";
import {createConnection} from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";

const main = async () => {
    const conn = await createConnection({
        type: "postgres",
        database: "lireddit2",
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: true,
        synchronize: true,
        entities: [Post, User, Updoot],
        migrations: [path.join(__dirname, "/migrations/*")]
    });
    await conn.runMigrations();
    const app = express();

    // await Post.delete({});
    
    EnumGraphQL();
    const RedisStore = connectRedis(session);
    const redis = new Redis();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}) : MyContext => ({req, res, redis})
        
    });

    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true
    }));

    app.use(
        session({
                name: COOKIE_NAME,
                store: new RedisStore({
                    client: redis,
                    disableTouch: true,
                }),
                secret: 'keyboard cat', 
                cookie: { 
                    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                    httpOnly: true,
                    secure: __prod__,
                    sameSite: 'lax',
                },
                resave: false,
                saveUninitialized: false,
            })
    );
    
    await apolloServer.start();

    apolloServer.applyMiddleware({app, cors : false});
    app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

    app.listen(4000, () => {
        console.log('Server started on localhost:4000');
    });

}

main().catch(err => {
    console.log(err);
});