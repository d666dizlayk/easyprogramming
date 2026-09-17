import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "./constants";
import { UserRole } from "../users/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role === UserRole.BUSINESS ? UserRole.BUSINESS : UserRole.PROGRAMMER,
      isAdmin: !!payload.isAdmin,
    };
  }
}
