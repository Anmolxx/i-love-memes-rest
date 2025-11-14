import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to make authentication optional
  handleRequest(err: any, user: any) {
    // If there's no user or an error, just return null instead of throwing
    if (err || !user) {
      return null;
    }
    return user;
  }
}
