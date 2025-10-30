import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const RawHeaders = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    return req.rawHeaders as string[];
  },
);
