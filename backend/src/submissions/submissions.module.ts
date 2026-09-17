import { AuditModule } from "../audit.module";
import { NotificationsModule } from "../notifications.module";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Submission } from "./submission.entity";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsController } from "./submissions.controller";
import { Task } from "../tasks/task.entity";
import { User } from "../users/user.entity";

@Module({
  imports: [AuditModule, NotificationsModule, TypeOrmModule.forFeature([Submission, Task, User])],
  providers: [SubmissionsService],
  controllers: [SubmissionsController],
  exports: [SubmissionsService], // ✅ ВОТ ЭТО ДОБАВЬ/ПРОВЕРЬ
})
export class SubmissionsModule {}
