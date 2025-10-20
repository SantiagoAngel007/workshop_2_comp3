
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RawHeaders = createParamDecorator(
  (data: unknown, context: ExecutionContext): string[] => {
    const request = context.switchToHttp().getRequest();
    return request.rawHeaders;
  }
);