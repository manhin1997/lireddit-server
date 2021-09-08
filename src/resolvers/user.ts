import { User } from "../entities/User";
import { MyContext } from "../types";
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PW_PREFIX } from "../constants";
import { UserNameType } from "../enums";
import { UserRegisterInput } from "./types/UserRegisterInput";
import { UserResponse } from "./types/UserResponse";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 as uuidv4 } from 'uuid';

@Resolver(User)
export class UserResolver {
    @FieldResolver(() => String)
    email(
        @Root() user: User, 
        @Ctx() {req} : MyContext
    ){
        if(req.session.userId === user._id){
            return user.email;
        }
        return "";

    }

    @Query(() => User, {nullable: true})
    me(
        @Ctx() {req} : MyContext
    ){
        //Not Logged in
        if (!req.session.userId){
            return null;
        }
        return User.findOne(req.session.userId);

    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options', () => UserRegisterInput) options: UserRegisterInput,
        @Ctx() {req} : MyContext
    ) : Promise<UserResponse>{

        const errors = validateRegister(options);
        if(errors.length > 0){
            return {
                errors: errors
            }
        }

        const hashedPassword = await argon2.hash(options.username);
        const user = User.create({
            username: options.username,
            password: hashedPassword,
            email: options.email
        })
        try{
            await user.save();
        } catch(err) {
            //Duplicate username error
            if(err.code == '23505'){ //|| err.detail.includes('already exists')
                return{
                    errors: [{
                        field: "username",
                        message: "username already taken"
                    }]
                }
            }
        }
        req.session.userId = user._id;
        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('l_username' , () => String) l_username : string,
        @Arg('password', () => String) password : string,
        @Arg('usernameType', () => UserNameType) usernameType : UserNameType,
        @Ctx() {req} : MyContext
    ) : Promise<UserResponse> {
        let user : User | undefined;
        switch(usernameType){
            case UserNameType.Email:
                user = await User.findOne({email : l_username});
                break;
            case UserNameType.Username:
                user = await User.findOne({username: l_username});
                break;
        }
        if(!user){
            if(usernameType === UserNameType.Email){
                return{
                    errors: [{
                        field: 'l_username',
                        message: "that email doesn't exist"
                    }]
                }
            }
            else{
                return{
                    errors: [{
                        field: 'l_username',
                        message: "that username doesn't exist"
                    }]
                }
            }
        }
        const valid = await argon2.verify(user.password, password);
        if(!valid){
            return{
                errors: [{
                    field: 'password',
                    message: "incorrect password"
                }]
            }
        }

        req.session.userId = user._id;
        //Login successfully
        return{
            user
        }
    }

    @Mutation(() => Boolean)
    async logout(
        @Ctx() {req, res} : MyContext
    ){
        return new Promise(resolve => req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME);
            if(err) {
                resolve(false);
                return;
            }
            resolve(true)
        }));
    }

    @Mutation(() => Boolean)
    async ForgetPassword(
        @Ctx() {redis} : MyContext,
        @Arg("l_username") l_username : string,
        @Arg('usernameType', () => UserNameType) usernameType : UserNameType,
    ){
        let user : User | undefined;
        switch(usernameType){
            case UserNameType.Email:
                user = await User.findOne({email : l_username})
                break;
            case UserNameType.Username:
                user = await User.findOne({username : l_username})
                break;
        }
        if(!user){
            return false;
        }
        try {
            const token = uuidv4();
            redis.set(FORGET_PW_PREFIX + token, user._id, 'ex', 1000 * 60 * 60 * 8);
            await sendEmail(user.email, "", `<a href="http://localhost:3000/change-password?token=${token}">Reset Password</a>`);
        } catch (error) {
            return false;
        }
        return true;
    }

    @Mutation(() => UserResponse)
    async ChangePassword(
        @Arg('token') token : string,
        @Arg('newPassword') newPassword : string,
        @Ctx() {redis, req} : MyContext,
    ): Promise<UserResponse> {
        if(newPassword.length <= 3){
            return{
                errors: [{
                    field: 'password',
                    message: 'length must be greater than 3',
                }]
            }
        }
        const userId = await redis.get(FORGET_PW_PREFIX+token);
        if(!userId){
            return{
                errors: [{
                    field: 'token',
                    message: 'Token Expired',
                }]
            }
        }
        const uId = parseInt(userId);
        const user = await User.findOne(uId);
        if(!user){
            return{
                errors: [{
                    field: 'token',
                    message: 'User no longer exist',
                }]
            }
        }
        const password = await argon2.hash(newPassword);
        await User.update({_id : uId}, {password});
        await redis.del(FORGET_PW_PREFIX+token);
        //Login after change password 
        req.session.userId = user._id;
        return {user}
    }
    
}