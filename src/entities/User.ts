import { Field, Int, ObjectType } from "type-graphql";
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToMany} from "typeorm";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity{

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt : Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt : Date;

  @Field()
  @Column({type: 'text', unique: true})
  username!: string;

  @Field()
  @Column({type: 'text', unique: true})
  email!: string;

  @Column({type: 'text'})
  password!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[];

}
