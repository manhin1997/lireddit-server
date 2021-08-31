import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() {em}: MyContext): Promise<Post[]>{
        return em.find(Post, {});
    }

    @Query(() => Post, {nullable : true})
    post(
        @Arg('id', () => Int) _id : number,
        @Ctx() {em} : MyContext
    ) : Promise<Post | null>{
        return em.findOne(Post, {_id});
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title") title : string,
        @Ctx() {em} : MyContext
    ) : Promise<Post>{
        const post = em.create(Post, {title});
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, {nullable : true})
    async updatePost(
        @Arg("id", () => Int) _id : number,
        @Arg("title") title : string,
        @Ctx() {em} : MyContext
    ) : Promise<Post | null>{
        const post = await em.findOne(Post, {_id});
        if(!post){
            return null;
        }
        if(typeof title !== 'undefined'){
            post.title = title;
            await em.persistAndFlush(post);    
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id", () => Int) _id : number,
        @Ctx() {em} : MyContext
    ) : Promise<boolean>{
        const number = await em.nativeDelete(Post, {_id});
        if(number >= 1)
            return true;
        return false;
    }


}