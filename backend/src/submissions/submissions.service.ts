import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Submission, SubmissionStatus } from "./submission.entity";
import { Task, TaskDifficulty } from "../tasks/task.entity";
import { User } from "../users/user.entity";
import { AuditService } from "../audit.service";
import { NotificationsService } from "../notifications.service";

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async createSubmission(params: {
    userId: number;
    taskId: number;
    status: SubmissionStatus;
    message?: string | null;
    passedCount?: number;
    totalCount?: number;
    code?: string | null;
    githubUrl?: string | null;
    durationMs?: number | null;
  }) {
    const user = await this.userRepo.findOne({ where: { id: params.userId } });
    const task = await this.taskRepo.findOne({ where: { id: params.taskId }, relations: ["business"] });

    if (!user || !task) return null;

    const submission = this.subRepo.create({
      user,
      task,
      status: params.status,
      message: params.message ?? null,
      moderationMessage: null,
      passedCount: params.passedCount ?? 0,
      totalCount: params.totalCount ?? 0,
      code: params.code ?? null,
      githubUrl: params.githubUrl ?? null,
      durationMs: params.durationMs ?? null,
    });

    const saved = await this.subRepo.save(submission);
    await this.audit.record({ action: "submission.created", taskId: task.id, submissionId: saved.id, actorId: user.id, message: "Решение отправлено на модерацию" });
    if (task.business?.id) {
      await this.notifications.create({ userId: task.business.id, type: "submission.created", title: "Новое решение", message: `По задаче «${task.title}» появилось решение на проверке.`, taskId: task.id, submissionId: saved.id });
    }
    return saved;
  }

  async getMySubmissions(userId: number) {
    return this.subRepo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  async getSolvedTaskIds(userId: number): Promise<number[]> {
    const rows = await this.subRepo
      .createQueryBuilder("s")
      .select("s.taskId", "taskId")
      .where("s.userId = :userId", { userId })
      .andWhere("s.status = :status", { status: "passed" })
      .groupBy("s.taskId")
      .getRawMany<{ taskId: number }>();

    return rows.map((r) => Number(r.taskId));
  }

  async getSolvedStats(userId: number) {
    const rows = await this.subRepo
      .createQueryBuilder("s")
      .innerJoin("s.task", "t")
      .select("t.difficulty", "difficulty")
      .addSelect("COUNT(DISTINCT t.id)", "count")
      .where("s.userId = :userId", { userId })
      .andWhere("s.status = :status", { status: "passed" })
      .groupBy("t.difficulty")
      .getRawMany<{ difficulty: TaskDifficulty; count: string }>();

    const base: Record<TaskDifficulty, number> = {
      [TaskDifficulty.EASY]: 0,
      [TaskDifficulty.MEDIUM]: 0,
      [TaskDifficulty.HARD]: 0,
    };

    for (const row of rows) {
      base[row.difficulty] = Number(row.count);
    }

    return base;
  }

  async getMySubmissionsForTask(userId: number, taskId: number) {
    return this.subRepo.find({
      where: {
        user: { id: userId } as any,
        task: { id: taskId } as any,
      },
      order: { createdAt: "DESC" },
      take: 20,
    });
  }

  async getMyBestSubmissionForTask(userId: number, taskId: number) {
    const passed = await this.subRepo.findOne({
      where: {
        user: { id: userId } as any,
        task: { id: taskId } as any,
        status: "passed",
      },
      order: { createdAt: "DESC" },
    });

    if (passed) return passed;

    return this.subRepo.findOne({
      where: {
        user: { id: userId } as any,
        task: { id: taskId } as any,
      },
      order: { createdAt: "DESC" },
    });
  }

  async getSolvedTasks(userId: number) {
    const rows = await this.subRepo
      .createQueryBuilder("s")
      .innerJoin("s.task", "t")
      .select("t.id", "id")
      .addSelect("t.title", "title")
      .addSelect("t.difficulty", "difficulty")
      .addSelect("t.language", "language")
      .addSelect('MAX("s"."createdAt")', "solvedAt")
      .addSelect('MAX("s"."githubUrl")', "githubUrl")
      .where('"s"."userId" = :userId', { userId })
      .andWhere('"s"."status" = :status', { status: "passed" })
      .groupBy("t.id")
      .addGroupBy("t.title")
      .addGroupBy("t.difficulty")
      .addGroupBy("t.language")
      .orderBy('MAX("s"."createdAt")', "DESC")
      .limit(20)
      .getRawMany();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      difficulty: row.difficulty,
      language: row.language,
      solvedAt: row.solvedAt,
      githubUrl: row.githubUrl,
    }));
  }

  async getByUser(userId: number) {
    return this.subRepo.find({
      where: {
        user: { id: userId },
      },
      relations: ["task"],
      order: { id: "DESC" },
    });
  }

  async getBusinessSubmissionsForUser(userId: number) {
    return this.subRepo.find({
      where: { task: { business: { id: userId } as any } as any },
      relations: ["user", "task"],
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  async getBusinessSubmissions(userId: number, taskId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, business: { id: userId } as any },
    });
    if (!task) throw new Error("Task not found");

    return this.subRepo.find({
      where: { task: { id: taskId } as any },
      relations: ["user", "task"],
      order: { createdAt: "DESC" },
    });
  }

  async getAll() {
    return this.subRepo.find({
      relations: ["user", "task"],
      order: { id: "DESC" },
    });
  }

  async getOne(id: number) {
    return this.subRepo.findOne({
      where: { id },
      relations: ["user", "task", "task.business"],
    });
  }

  async approveSubmission(id: number) {
    const submission = await this.subRepo.findOne({
      where: { id },
      relations: ["user", "task"],
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new BadRequestException("Можно модерировать только решение, находящееся на проверке");
    }

    const difficulty = String(submission.task?.difficulty || "").toLowerCase();

    let reward = 0;

    if (difficulty === "easy") reward = 120;
    if (difficulty === "medium") reward = 250;
    if (difficulty === "hard") reward = 450;

    submission.status = "passed";
    submission.message = "Решение принято";
    submission.moderationMessage = null;
    await this.taskRepo.update({ id: submission.task.id }, { status: "completed" as any });

    submission.user.exp = Number(submission.user.exp || 0) + reward;

    await this.userRepo.save(submission.user);
    await this.subRepo.save(submission);
    await this.audit.record({ action: "submission.approved", taskId: submission.task.id, submissionId: submission.id, actorId: null, message: `Решение принято, +${reward} XP` });
    await this.notifications.create({ userId: submission.user.id, type: "submission.approved", title: "Решение принято", message: `Решение по задаче «${submission.task.title}» принято. Начислено +${reward} XP.`, taskId: submission.task.id, submissionId: submission.id });
    if (submission.task.business?.id) {
      await this.notifications.create({ userId: submission.task.business.id, type: "submission.approved", title: "Решение принято", message: `Решение по задаче «${submission.task.title}» прошло модерацию.`, taskId: submission.task.id, submissionId: submission.id });
    }

    return {
      ok: true,
      reward,
      exp: submission.user.exp,
    };
  }

  async rejectSubmission(id: number, message?: string) {
    const submission = await this.subRepo.findOne({
      where: { id },
      relations: ["user", "task", "task.business"],
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new BadRequestException("Можно вернуть только решение, находящееся на проверке");
    }

    const reason = message?.trim() || null;
    if (!reason) {
      throw new Error("Укажите причину возврата решения на доработку");
    }

    submission.status = "failed";
    submission.moderationMessage = reason;
    await this.taskRepo.update({ id: submission.task?.id }, { status: "in_progress" as any });

    await this.subRepo.save(submission);
    await this.audit.record({ action: "submission.rejected", taskId: submission.task?.id ?? null, submissionId: submission.id, message: reason });
    await this.notifications.create({ userId: submission.user.id, type: "submission.rejected", title: "Решение возвращено", message: `Решение по задаче «${submission.task?.title || "задача"}» требует доработки: ${reason}`, taskId: submission.task?.id ?? null, submissionId: submission.id });
    return { ok: true };
  }
}