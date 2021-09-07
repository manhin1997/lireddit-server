import { FieldError } from "../resolvers/types/FieldError";
import { UserRegisterInput } from "../resolvers/types/UserRegisterInput";
import { validateEmail } from "./validateEmail";

export const validateRegister = (options : UserRegisterInput) => {
    let returnError : FieldError[] = [];
    if(options.username.length <= 3){
        returnError.push(
            {
                field: 'username',
                message: 'length must be greater than 3',
            }
        );
    }
    
    if(options.password.length <= 3){
        returnError.push(
            {
                field: 'password',
                message: 'length must be greater than 3',
            }
        );
    }
    
    if(!validateEmail(options.email)){
        returnError.push({
            field: 'email',
            message: 'the email provided is not a valid email'
        })
    }
    return returnError;
}

