import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const PASSWORD_POLICY_MESSAGE =
  "Пароль должен содержать от 8 до 128 символов, минимум одну букву и одну цифру. Пробелы в начале и конце не допускаются.";

function validatePassword(password: string) {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 128) return false;
  if (/^\s|\s$/.test(password)) return false;
  if (!/[A-Za-zА-Яа-яЁё]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isAdmin: user.isAdmin,
    };
  }

  async register(dto: RegisterDto) {
    if (!validatePassword(dto.password)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }

    const emailExists = await this.userRepository.findOne({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException("Такая почта уже зарегистрирована");

    const usernameExists = await this.userRepository.findOne({ where: { username: dto.username } });
    if (usernameExists) throw new ConflictException("Username уже занят");

    const role = dto.role === UserRole.BUSINESS ? UserRole.BUSINESS : UserRole.PROGRAMMER;
    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      username: dto.username,
      password: hash,
      role,
      avatar: "default-avatar.png",
      isAdmin: false,
    });

    await this.userRepository.save(user);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    });

    return { token, user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Неверная почта или пароль');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Неверная почта или пароль');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    });

    return { token, user: this.publicUser(user) };
  }
}
