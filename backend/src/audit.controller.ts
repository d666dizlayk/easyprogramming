import { Controller, Get, Param, ParseIntPipe, Req, UseGuards, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { AuditService } from "./audit.service";
import { TasksService } from "./tasks/tasks.service";
import { UserRole } from "./users/user.entity";

@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService, private readonly tasks: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get("tasks/:id")
  async taskHistory(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    const task = await this.tasks.findOneWithAssignment(id);
    if (!task) throw new ForbiddenException("Задача не найдена");

    const userId = Number(req.user?.id ?? req.user?.sub);
    const isAdmin = Boolean(req.user?.isAdmin);
    const isBusinessOwner = task.business?.id === userId;
    const isAssigned = task.assignedProgrammer?.id === userId;
    const isProgrammer = req.user?.role === UserRole.PROGRAMMER && isAssigned;

    if (!isAdmin && !isBusinessOwner && !isProgrammer) {
      throw new ForbiddenException("История доступна участникам задачи");
    }

    return this.audit.forTask(id);
  }
}
