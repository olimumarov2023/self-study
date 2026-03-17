import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';

import { PrismaService } from '../prisma/prisma.service.js';

import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const appSecret = this.configService.get<string>('APP_SECRET');
    if (!appSecret) {
      throw new UnauthorizedException('Invalid password');
    }

    const inputBuffer = Buffer.from(dto.password);
    const secretBuffer = Buffer.from(appSecret);
    if (inputBuffer.length !== secretBuffer.length || !timingSafeEqual(inputBuffer, secretBuffer)) {
      throw new UnauthorizedException('Invalid password');
    }

    // Get the single user from the database (or the first one)
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new UnauthorizedException('No user found. Please run database seed first.');
    }

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
