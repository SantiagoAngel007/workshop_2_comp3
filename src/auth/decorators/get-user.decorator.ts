import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import * as request from 'supertest';


export const GetUser = createParamDecorator(
    (data, context: ExecutionContext) =>{
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if(!user) throw new InternalServerErrorException(`User not found`);

        return user;
    }
)