import { Controller, Get, UseGuards, Req, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubmissionsService } from "./submissions.service";
import { ParseIntPipe, BadRequestException } from "@nestjs/common";
import { Patch, Body } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { UserRole } from "../users/user.entity";
import { ForbiddenException } from "@nestjs/common";


@UseGuards(JwtAuthGuard)
@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  private getUserId(req: any) {
    return Number(req.user?.id); // ✅ важно
  }

  

  // ✅ GET /submissions/me/task/:taskId
  @Get("me/task/:taskId")
  getForTask(@Req() req: any, @Param("taskId", ParseIntPipe) taskId: number) {
    return this.submissions.getMySubmissionsForTask(req.user.id, taskId);
  }


  @Get("me/task/:taskId/best")
  getBestForTask(@Req() req: any, @Param("taskId") taskId: string) {
    const userId = Number(req.user?.id); // важно: у тебя req.user.id
    return this.submissions.getMyBestSubmissionForTask(userId, Number(taskId));
  }

  // GET /submissions/me
  @Get("me")
  getMe(@Req() req: any) {
    return this.submissions.getMySubmissions(this.getUserId(req));
  }

  // GET /submissions/me/solved
  @Get("me/solved")
  getSolved(@Req() req: any) {
    return this.submissions.getSolvedTaskIds(this.getUserId(req));
  }

  @Get("me/solved/tasks")
  getSolvedTasks(@Req() req: any) {
    const userId = Number(req.user?.id);
    return this.submissions.getSolvedTasks(userId);
  }


  // GET /submissions/me/stats
  @Get("me/stats")
  getStats(@Req() req: any) {
    return this.submissions.getSolvedStats(this.getUserId(req));
  }

  @Get("my")
  getMySubmissions(@Req() req) {
  return this.submissions.getByUser(req.user.id);
  }

  @Get("business/mine")
  async getBusinessMine(@Req() req: any) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может просматривать ответы на свои задачи");
    return this.submissions.getBusinessSubmissionsForUser(Number(req.user.id));
  }

  @Get("business/task/:taskId")
  async getBusinessTaskSubmissions(@Req() req: any, @Param("taskId", ParseIntPipe) taskId: number) {
    if (req.user?.role !== UserRole.BUSINESS) throw new ForbiddenException("Только бизнес может просматривать ответы на свои задачи");
    return this.submissions.getBusinessSubmissions(Number(req.user.id), taskId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  getAll() {
    return this.submissions.getAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id")
  getOne(@Param("id", ParseIntPipe) id: number) {
    return this.submissions.getOne(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/approve")
  approve(@Param("id", ParseIntPipe) id: number) {
    return this.submissions.approveSubmission(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(":id/reject")
  reject(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { message?: string },
  ) {
    if (!body?.message?.trim()) throw new BadRequestException("Укажите причину возврата решения на доработку");
    return this.submissions.rejectSubmission(id, body.message);
  }
}
