import { Post } from "../entities/Post";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[]
    @Field()
    hasMore: boolean;
}
//Sort post list by new (Date)
@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() post: Post) {
        return post.text.slice(0,50);
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
    ): Promise<PaginatedPosts>{
        //Get 51 post, check length of the post. If < 51, return hasMore : false
        const realLimit = Math.min(50, limit);
        const realLimitplusOne = realLimit + 1;

        const replacements:any = [realLimitplusOne];
        if(cursor){
            replacements.push(new Date(parseInt(cursor)));
        }


        const posts = await getConnection().query(`
        SELECT p.*,
        json_build_object(
            '_id', u._id,
            'username', u.username,
            'email', u.email
        ) creator
        FROM post p
        INNER JOIN public.user u on u._id = p."creatorId"
        ${cursor ? `WHERE p."createdAt" < $2` : ''}
        ORDER BY p."createdAt" DESC
        LIMIT $1
        `, replacements);

        // const qb =  getConnection()
        // .getRepository(Post)
        // .createQueryBuilder("p")
        // .innerJoinAndSelect('p.creator', 'u', 'u._id = p."creatorId"')
        // .orderBy('p."createdAt"', "DESC")
        // .take(realLimitplusOne)

        // if(cursor){
        //     qb.where('p."createdAt" < :cursor', 
        //     {cursor : new Date(parseInt(cursor))});
        // }

        //const posts = await qb.getMany();
        //console.log(posts);
        return {posts: posts.slice(0, realLimit), hasMore: (posts.length >= realLimitplusOne)};

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

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId : number,
        @Arg('value', () => Int) value : number,
        @Ctx() {req} : MyContext
    ){
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const {userId} = req.session;
        const updoot = await Updoot.findOne({where: {postId, userId}});
        ///User that voted before && changing their value
        if(updoot && updoot.value !== realValue){
            await getConnection().transaction(
                async tm => {
                    await tm.query(`
                        UPDATE updoot
                        SET value = $1
                        WHERE "postId" = $2 AND "userId" = $3
                    `, [realValue, postId, userId]);
                    await tm.query(`
                        UPDATE post
                        SET points = points + $1
                        WHERE post._id = $2;`,
                    [realValue * 2, postId]);
                }
            );
        } else if(!updoot){
            await getConnection().transaction(
                async tm => {
                    await tm.query(`
                        insert into updoot ("userId", "postId", value)
                        values ($1,$2,$3);
                    `, [userId, postId, realValue]);
                    await tm.query(`
                        UPDATE post
                        SET points = points + $1
                        WHERE post._id = $2;`,
                    [realValue, postId]);
                }
            );
        }
        else{
            return false;
        }
        return true;
    }


}