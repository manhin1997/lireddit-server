import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, OneToMany} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field()
  @Column()
  creatorId : number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt : Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt : Date;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({type : "int", default : 0})
  points!: number;

  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator: User;

  @OneToMany(() => Updoot, updoot => updoot.post)
  updoots: Updoot[];
}