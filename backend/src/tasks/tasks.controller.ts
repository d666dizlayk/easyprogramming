import { Controller, Get, Param, Query, Post, Body, UseGuards, Req, NotFoundException, ParseIntPipe, BadRequestException, Patch, Delete, ForbiddenException } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TaskDifficulty, TaskStatus } from "./task.entity";
import { ApplicationStatus } from "./application.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubmissionsService } from "../submissions/submissions.service";
import { AdminGuard } from "../auth/admin.guard";
import { UserRole } from "../users/user.entity";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService, private readonly submissions: SubmissionsService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("admin/all") getAllAdmin(@Query("difficulty") difficulty?: TaskDifficulty) { return this.tasksService.findAll(difficulty, true); }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id/admin") async getOneAdmin(@Param("id", ParseIntPipe) id: number) {
    const task = await this.tasksService.findOne(id); if (!task) throw new NotFoundException("Задача не найдена"); return task;
  }

  @UseGuards(JwtAuthGuard)
  @Get("business/mine") getBusinessTasks(@Req() req: any) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может просматривать свои задачи");
    return this.tasksService.findByBusiness(Number(req.user.id));
  }

  @Get() getAll(@Query("difficulty") difficulty?: TaskDifficulty) { return this.tasksService.findAll(difficulty); }

  @Get(":id") async getOne(@Param("id", ParseIntPipe) id: number) {
    const task = await this.tasksService.findOneWithAssignment(id);
    if (!task) throw new NotFoundException("Задача не найдена");
    if ([TaskStatus.PENDING, TaskStatus.REJECTED].includes(task.status)) throw new NotFoundException("Задача недоступна");
    const { hiddenTests, ...safe } = task as any;
    if (safe.assignedProgrammer) {
      safe.assignedProgrammer = { id: safe.assignedProgrammer.id, username: safe.assignedProgrammer.username, avatar: safe.assignedProgrammer.avatar };
    }
    return safe;
  }

  @UseGuards(JwtAuthGuard)
  @Patch("business/:id") async updateBusiness(@Req() req: any, @Param("id", ParseIntPipe) id: number, @Body() dto: any) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может редактировать задачи");
    if (!dto.title?.trim() || !dto.description?.trim()) throw new BadRequestException("Название и описание обязательны");
    return this.tasksService.updateBusinessTask(Number(req.user.id), id, {
      ...dto, title: dto.title.trim(), description: dto.description.trim(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete("business/:id") async deleteBusiness(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может удалять задачи");
    return this.tasksService.deleteBusinessTask(Number(req.user.id), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("business") async createBusiness(@Req() req: any, @Body() dto: any) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может размещать задачи");
    if (!dto.title?.trim() || !dto.description?.trim()) throw new BadRequestException("Название и описание обязательны");
    if (!dto.language?.trim()) throw new BadRequestException("Выберите язык программирования");
    return this.tasksService.createTask({ ...dto, title: dto.title.trim(), description: dto.description.trim(), status: TaskStatus.PENDING }, { id: Number(req.user.id) } as any);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post() create(@Body() dto: any) {
    if (!dto.language?.trim()) throw new BadRequestException("Выберите язык программирования");
    return this.tasksService.createTask({ ...dto, status: TaskStatus.APPROVED });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() dto: any) { return this.tasksService.updateTask(id, dto); }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/moderate") moderate(@Param("id", ParseIntPipe) id: number, @Body() body: { status: TaskStatus; message?: string }) {
    if (![TaskStatus.APPROVED, TaskStatus.REJECTED, TaskStatus.PENDING].includes(body.status)) throw new BadRequestException("Некорректный статус");
    return this.tasksService.moderate(id, body.status, body.message);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) { return this.tasksService.deleteTask(id); }

  @UseGuards(JwtAuthGuard)
  @Get(":id/applications")
  async getApplications(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    const userId = Number(req.user?.id);
    if (req.user?.isAdmin) return this.tasksService.getAdminApplications(id);
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес или администратор может просматривать заявки");
    return this.tasksService.getBusinessApplications(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/my-application")
  async getMyApplication(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
    if (req.user?.role !== UserRole.PROGRAMMER) throw new ForbiddenException("Только программист может просматривать свои заявки");
    return this.tasksService.getMyApplication(Number(req.user.id), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/apply")
  async apply(@Req() req: any, @Param("id", ParseIntPipe) id: number, @Body() body: { message?: string }) {
    if (req.user?.role !== UserRole.PROGRAMMER) throw new ForbiddenException("Только программист может подавать заявки");
    return this.tasksService.applyToTask(Number(req.user.id), id, body?.message);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/applications/:applicationId")
  async decideApplication(@Req() req: any, @Param("id", ParseIntPipe) id: number, @Param("applicationId", ParseIntPipe) applicationId: number, @Body() body: { status: ApplicationStatus }) {
    if (![ApplicationStatus.ACCEPTED, ApplicationStatus.DECLINED].includes(body.status)) throw new BadRequestException("Некорректный статус заявки");
    return this.tasksService.decideApplicationAsAdmin(Number(req.user.id), id, applicationId, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/submit") async submit(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { githubUrl?: string },
    @Req() req: any,
  ) {
    const task = await this.tasksService.findOneWithAssignment(id);
    if (!task || [TaskStatus.PENDING, TaskStatus.REJECTED].includes(task.status)) throw new NotFoundException("Задача не найдена");
    if (req.user?.role !== UserRole.PROGRAMMER) throw new ForbiddenException("Только программист может отправлять решения");

    if (task.assignedProgrammer?.id !== Number(req.user?.id ?? req.user?.sub)) {
      throw new ForbiddenException("Сначала получите назначение на эту задачу");
    }
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException("Эта задача сейчас не принимает решения");
    }

    const githubUrl = body.githubUrl?.trim() || null;
    if (!githubUrl) throw new BadRequestException("Укажите ссылку на GitHub репозиторий");
    if (!/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(githubUrl)) {
      throw new BadRequestException("Некорректная ссылка на GitHub репозиторий");
    }

    const userId = Number(req.user?.id ?? req.user?.sub);
    if (!userId || Number.isNaN(userId)) throw new BadRequestException("Invalid user id in JWT payload");

    const existingPassed = await this.submissions.getMyBestSubmissionForTask(userId, task.id);
    if (existingPassed?.status === "passed") {
      return { status: "passed", message: "Эта задача уже принята", submission: existingPassed };
    }

    const existing = await this.submissions.getMyBestSubmissionForTask(userId, task.id);
    if (existing?.status === "pending") {
      return { status: "pending", message: "Решение уже находится на проверке", submission: existing };
    }

    const submission = await this.submissions.createSubmission({
      userId,
      taskId: task.id,
      status: "pending",
      message: "Решение отправлено на модерацию",
      code: null,
      githubUrl,
    });
    return { status: "pending", message: "Решение отправлено на проверку", submission };
  }
}
