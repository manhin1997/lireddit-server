import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from './mikro-orm.config';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "./types";
import expressPlayground from 'graphql-playground-middleware-express';

const main = async () => {

    
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();
    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}) : MyContext => ({req, res ,em : orm.em})
        
    });

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
                name: "qid",
                store: new RedisStore({
                    client: redisClient,
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

    apolloServer.applyMiddleware({app});
    app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

    app.listen(4000, () => {
        console.log('Server started on localhost:4000');
    });

}

main().catch(err => {
    console.log(err);
});