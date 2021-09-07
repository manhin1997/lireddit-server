import { Post } from "../entities/Post";
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}
//Sort post list by new (Date)
@Resolver()
export class PostResolver {
    @Query(() => [Post])
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null
    ): Promise<Post[]>{
        const realLimit = Math.min(50, limit);

        const qb =  getConnection()
        .getRepository(Post)
        .createQueryBuilder("p")
        .orderBy('"createdAt"', "DESC")
        .take(realLimit)

        if(cursor){
            qb.where('"createdAt" < :cursor', 
            {cursor : new Date(parseInt(cursor))});
        }

        return qb.getMany();

    }

    @Query(() => Post, {nullable : true})
    post(
        @Arg('id', () => Int) _id : number,
    ) : Promise<Post | undefined>{
        return Post.findOne({_id});
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input : PostInput,
        @Ctx() {req} : MyContext
    ) : Promise<Post>{
        const post = Post.create({
            ...input,
            creatorId: req.session.userId
        });
        await post.save();
        return post;
    }

    @Mutation(() => Post, {nullable : true})
    async updatePost(
        @Arg("id", () => Int) _id : number,
        @Arg("title") title : string,
    ) : Promise<Post | null>{
        const post = await Post.findOne(_id);
        if(!post){
            return null;
        }
        if(typeof title !== 'undefined'){
            await Post.update({_id}, {title});  
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id", () => Int) _id : number,
    ) : Promise<boolean>{
        await Post.delete(_id);
        return true;
    }


}