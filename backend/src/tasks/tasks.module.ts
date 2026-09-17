import { AuditModule } from "../audit.module";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { Task } from "./task.entity";
import { TaskApplication } from "./application.entity";
import { SubmissionsModule } from "src/submissions/submissions.module";
import { NotificationsModule } from "../notifications.module";

@Module({
  imports: [AuditModule, NotificationsModule, TypeOrmModule.forFeature([Task, TaskApplication]), SubmissionsModule,],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

