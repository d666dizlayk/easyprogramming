import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.contoller";
import { SubmissionsModule } from "../submissions/submissions.module";
import { Task } from "../tasks/task.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Task]), SubmissionsModule],
  providers: [UsersService],
  controllers: [UsersController], // ❗ ОБЯЗАТЕЛЬНО
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
