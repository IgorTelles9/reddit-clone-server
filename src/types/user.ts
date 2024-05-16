import { Field, ObjectType } from "type-graphql";
import { User } from "@generated/type-graphql/models/User";
import { FieldError } from "./error";

@ObjectType()
export class UserResponse {
    @Field(() => User, { nullable: true })
    user?: User;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}