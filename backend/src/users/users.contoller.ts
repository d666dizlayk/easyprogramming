import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "../auth/dto/update-profile.dto";
import { Param, NotFoundException } from "@nestjs/common";
import { SubmissionsService } from "../submissions/submissions.service";
import { Task, TaskStatus } from "../tasks/task.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


@Controller("users")

export class UsersController {
  constructor(
  private readonly usersService: UsersService,
  private readonly submissionsService: SubmissionsService,
  @InjectRepository(Task) private readonly tasksRepo: Repository<Task>,
) {}


  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req, @Body() dto: UpdateProfileDto) {
    return await this.usersService.updateProfile(req.user.id, dto);
  }

  @Get("rating")
  async getRating() {
    return this.usersService.getRating();
  }

  @Get("public/:username")
  async getPublic(@Param("username") username: string) {
    const user = await this.usersService.findPublicByUsername(username);
    if (!user) throw new NotFoundException("User not found");

    const stats = await this.submissionsService.getSolvedStats(user.id);
    const solvedTasks = await this.submissionsService.getSolvedTasks(user.id);
    const businessTasks = user.role === "business" ? await this.tasksRepo.find({
      where: { business: { id: user.id } as any, status: TaskStatus.APPROVED },
      order: { createdAt: "DESC" },
    }) : [];

    return { user, stats, solvedTasks, businessTasks };
  }


  @Post("avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_, file, cb) => {
          const ext = file.originalname.split(".").pop();
          cb(null, `${Date.now()}.${ext}`);
        },
      }),
    }),
  )
  uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(req.user.id, file.filename);
  }
}
