import { registerEnumType } from "type-graphql"
import * as Enums from "../enums";

export const EnumGraphQL = () : void => {
    registerEnumType(Enums.UserNameType, {
        name: "UserNameType",
        description: "This Enum defined the type of username the user is using to Login"
    });
}