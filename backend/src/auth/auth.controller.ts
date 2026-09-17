// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    // ✅ передаём ВЕСЬ dto
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    // ✅ передаём ВЕСЬ dto
    return this.authService.login(dto);
  }
}
