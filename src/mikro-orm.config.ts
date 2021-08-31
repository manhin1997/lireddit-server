import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core"
import path from "path";
import dotenv from 'dotenv';
import { User } from "./entities/User";

dotenv.config();

const ormConfig = {
    entities: [Post, User],
    dbName: 'lireddit',
    type: 'postgresql',
    debug: !__prod__,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    migrations: {
        path: path.join(__dirname, './migrations'), // path to the folder with migrations    
        pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
    }

} as Parameters<typeof MikroORM.init>[0];

export default ormConfig;