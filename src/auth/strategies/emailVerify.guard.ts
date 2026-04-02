import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user?.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before accessing this feature. Check your inbox or request a new verification email at POST /auth/resend-verification',
      );
    }

    return true;
  }
}