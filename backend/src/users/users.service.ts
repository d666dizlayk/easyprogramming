import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "./user.entity";
import { UpdateProfileDto } from "../auth/dto/update-profile.dto";
import { normalizeTaskLanguage } from "../tasks/task-language";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: number) {
    return this.usersRepo.findOne({
      where: { id },
      select: ["id", "email", "username", "role", "stack", "bio", "avatar", "isAdmin", "exp"],
    });
  }

  async getRating() {
    const users = await this.usersRepo.find({
      where: { role: UserRole.PROGRAMMER },
      select: ["id", "username", "role", "avatar", "exp"],
      order: { exp: "DESC", username: "ASC" },
      take: 100,
    });

    return users.map((user) => ({
      ...user,
      level: user.exp >= 1600 ? "Expert" : user.exp >= 800 ? "Senior" : user.exp >= 300 ? "Middle" : "Junior",
    }));
  }

  findPublicByUsername(username: string) {
  return this.usersRepo.findOne({
    where: { username },
    select: ["id", "username", "role", "stack", "bio", "avatar", "isAdmin", "exp"],
  });
  }


  async updateProfile(userId: number, data: UpdateProfileDto) {
    const update: UpdateProfileDto = {};

    if (typeof data.username === "string") {
      update.username = data.username.trim();
    }

    if (typeof data.bio === "string") {
      update.bio = data.bio.trim();
    }

    if (Array.isArray(data.stack)) {
      const normalized = data.stack
        .map((item) => normalizeTaskLanguage(item))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      update.stack = [...new Set(normalized)];
    }

    await this.usersRepo.update({ id: userId }, update);
    return this.findById(userId);
  }

  async updateAvatar(id: number, filename: string) {
    await this.usersRepo.update(id, { avatar: filename });
    return this.findById(id);
  }
}
