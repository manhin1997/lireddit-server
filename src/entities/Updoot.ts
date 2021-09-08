import {Entity, BaseEntity, ManyToOne, PrimaryColumn, Column} from "typeorm";
import { Field } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";

//m to n
//many to many
//user <-> post
//user -> updoot <- posts
@Entity()
export class Updoot extends BaseEntity{

    @Field()
    @Column({type: "int"})
    value: number;

    @Field()
    @PrimaryColumn()
    userId : number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.updoots)
    user: User;

    @Field()
    @PrimaryColumn()
    postId : number;

    @Field(() => Post)
    @ManyToOne(() => Post, post => post.updoots)
    post: Post;


}