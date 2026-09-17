import { UserRole } from "../../users/user.entity";

export class RegisterDto {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}
