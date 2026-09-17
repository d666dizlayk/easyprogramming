import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Task, TaskDifficulty, TaskStatus } from "./task.entity";
import { ApplicationStatus, TaskApplication } from "./application.entity";
import { User } from "../users/user.entity";
import { AuditService } from "../audit.service";
import { NotificationsService } from "../notifications.service";
import { normalizeTaskLanguage, validateTaskLanguage } from "./task-language";

@Injectable()
export class TasksService {
  private legacyLanguagesNormalized = false;

  constructor(
    @InjectRepository(Task) private readonly repo: Repository<Task>,
    @InjectRepository(TaskApplication) private readonly applicationsRepo: Repository<TaskApplication>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private async normalizeLegacyLanguages() {
    if (this.legacyLanguagesNormalized) return;
    this.legacyLanguagesNormalized = true;

    const rows = await this.repo.find({ select: ["id", "language"] });
    for (const row of rows) {
      const raw = row.language;
      const normalized = normalizeTaskLanguage(raw);
      if (raw && normalized !== raw) {
        await this.repo.update(row.id, { language: normalized });
      }
    }
  }

  async findAll(difficulty?: TaskDifficulty, includePending = false) {
    await this.normalizeLegacyLanguages();
    const where: any = difficulty ? { difficulty } : {};
    if (!includePending) where.status = TaskStatus.APPROVED;
    return this.repo.find({ where, relations: ["business"], order: { id: "DESC" } });
  }

  async findOne(id: number) {
    await this.normalizeLegacyLanguages();
    return this.repo.findOne({ where: { id }, relations: ["business"] });
  }

  async findOneWithAssignment(id: number) {
    await this.normalizeLegacyLanguages();
    return this.repo.findOne({ where: { id }, relations: ["business", "assignedProgrammer"] });
  }

  async findByBusiness(userId: number) {
    await this.normalizeLegacyLanguages();
    return this.repo.find({ where: { business: { id: userId } as any }, relations: ["business"], order: { createdAt: "DESC" } });
  }

  async getBusinessApplications(userId: number, taskId: number) {
    const task = await this.repo.findOne({ where: { id: taskId, business: { id: userId } as any } });
    if (!task) throw new NotFoundException("Задача не найдена");
    return this.applicationsRepo.find({
      where: { task: { id: taskId } as any },
      relations: ["programmer"],
      order: { createdAt: "ASC" },
    });
  }

  async getAdminApplications(taskId: number) {
    const task = await this.repo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Задача не найдена");
    return this.applicationsRepo.find({
      where: { task: { id: taskId } as any },
      relations: ["programmer", "task"],
      order: { createdAt: "ASC" },
    });
  }

  async getMyApplication(userId: number, taskId: number) {
    return this.applicationsRepo.findOne({
      where: { task: { id: taskId } as any, programmer: { id: userId } as any },
      relations: ["programmer", "task"],
      order: { createdAt: "DESC" },
    });
  }

  async applyToTask(userId: number, taskId: number, message?: string) {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ["business", "assignedProgrammer"] });
    if (!task || task.status !== TaskStatus.APPROVED) throw new NotFoundException("Задача недоступна");
    if (task.business?.id === userId) throw new ForbiddenException("Нельзя подавать заявку на собственную задачу");
    if (task.assignedProgrammer?.id) throw new BadRequestException("У задачи уже есть исполнитель");

    const alreadyWorking = await this.repo.findOne({ where: { assignedProgrammer: { id: userId } as any, status: TaskStatus.IN_PROGRESS }, relations: ["assignedProgrammer"] });
    const alreadyUnderReview = await this.repo.findOne({ where: { assignedProgrammer: { id: userId } as any, status: TaskStatus.REVIEW }, relations: ["assignedProgrammer"] });
    if (alreadyWorking || alreadyUnderReview) throw new BadRequestException("Сначала завершите текущую задачу");

    const previous = await this.applicationsRepo.findOne({
      where: { task: { id: taskId } as any, programmer: { id: userId } as any },
      order: { createdAt: "DESC" },
    });
    if (previous?.status === ApplicationStatus.PENDING || previous?.status === ApplicationStatus.ACCEPTED) {
      throw new BadRequestException("Заявка на эту задачу уже существует");
    }

    const pendingCount = await this.applicationsRepo.count({
      where: { task: { id: taskId } as any, status: ApplicationStatus.PENDING },
    });
    if (pendingCount >= 5) throw new BadRequestException("На эту задачу уже подано максимальное число заявок");

    const application = this.applicationsRepo.create({
      task, programmer: { id: userId } as any, message: message?.trim() || null, status: ApplicationStatus.PENDING,
    });
    const saved = await this.applicationsRepo.save(application);
    await this.audit.record({ action: "application.created", taskId, actorId: userId, message: message?.trim() || null });
    if (task.business?.id) {
      await this.notifications.create({
        userId: task.business.id,
        type: "application.created",
        title: "Новая заявка",
        message: `Разработчик подал заявку на задачу «${task.title}».`,
        taskId,
      });
    }

    await this.notifications.createForAdmins({
      type: "application.created.admin",
      title: "Новая заявка на модерацию",
      message: `Разработчик подал заявку на задачу «${task.title}». Проверьте заявку и при необходимости свяжитесь с бизнесом.`,
      taskId,
    });
    return this.applicationsRepo.findOne({ where: { id: saved.id }, relations: ["programmer", "task"] });
  }

  async decideApplication(userId: number, taskId: number, applicationId: number, status: ApplicationStatus) {
    const task = await this.repo.findOne({ where: { id: taskId, business: { id: userId } as any }, relations: ["business", "assignedProgrammer"] });
    if (!task) throw new NotFoundException("Задача не найдена");
    return this.applyApplicationDecision(task, applicationId, status, userId, false);
  }

  async decideApplicationAsAdmin(adminId: number, taskId: number, applicationId: number, status: ApplicationStatus) {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ["business", "assignedProgrammer"] });
    if (!task) throw new NotFoundException("Задача не найдена");
    return this.applyApplicationDecision(task, applicationId, status, adminId, true);
  }

  private async applyApplicationDecision(
    task: Task,
    applicationId: number,
    status: ApplicationStatus,
    actorId: number,
    isAdmin: boolean,
  ) {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, task: { id: task.id } as any },
      relations: ["programmer", "task"],
    });
    if (!application) throw new NotFoundException("Заявка не найдена");
    if (application.status !== ApplicationStatus.PENDING) throw new BadRequestException("Заявка уже обработана");

    if (status === ApplicationStatus.DECLINED) {
      application.status = ApplicationStatus.DECLINED;
      const saved = await this.applicationsRepo.save(application);
      await this.audit.record({ action: "application.declined", taskId: task.id, actorId, message: isAdmin ? "Заявка отклонена администратором" : "Заявка отклонена бизнесом" });
      await this.notifications.create({
        userId: application.programmer.id,
        type: "application.declined",
        title: "Заявка отклонена",
        message: `Заявка на «${task.title}» была отклонена${isAdmin ? " администратором" : " бизнесом"}.`,
        taskId: task.id,
      });
      if (isAdmin && task.business?.id) {
        await this.notifications.create({
          userId: task.business.id,
          type: "application.declined.admin",
          title: "Заявка отклонена администратором",
          message: `Заявка на задачу «${task.title}» была отклонена администратором.`,
          taskId: task.id,
        });
      }
      return saved;
    }

    if (task.status !== TaskStatus.APPROVED) throw new BadRequestException("Задачу нельзя назначить в текущем статусе");
    if (task.assignedProgrammer?.id) throw new BadRequestException("У задачи уже есть исполнитель");

    task.assignedProgrammer = application.programmer;
    task.status = TaskStatus.IN_PROGRESS;
    application.status = ApplicationStatus.ACCEPTED;
    await this.repo.save(task);
    await this.audit.record({ action: "application.accepted", taskId: task.id, actorId, message: `${isAdmin ? "Администратор" : "Бизнес"} назначил программиста #${application.programmer.id}` });
    await this.audit.record({ action: "task.assigned", taskId: task.id, actorId, message: `Исполнитель #${application.programmer.id}` });
    await this.notifications.create({
      userId: application.programmer.id,
      type: "application.accepted",
      title: "Заявка принята",
      message: `Вы назначены исполнителем задачи «${task.title}».`,
      taskId: task.id,
    });
    if (task.business?.id && isAdmin) {
      await this.notifications.create({
        userId: task.business.id,
        type: "application.accepted.admin",
        title: "Исполнитель назначен администратором",
        message: `На задачу «${task.title}» назначен разработчик.`,
        taskId: task.id,
      });
    } else if (task.business?.id) {
      await this.notifications.create({
        userId: task.business.id,
        type: "task.assigned",
        title: "Исполнитель назначен",
        message: `На задачу «${task.title}» назначен разработчик.`,
        taskId: task.id,
      });
    }
    await this.applicationsRepo.update(
      { task: { id: task.id } as any, id: Not(applicationId) },
      { status: ApplicationStatus.DECLINED },
    );
    return this.applicationsRepo.save(application);
  }

  async createTask(dto: Partial<Task>, business?: User) {
    let language: string | null = null;
    try { language = validateTaskLanguage(dto.language); } catch (e: any) { throw new BadRequestException(e?.message || "Выберите язык программирования"); }
    const task = this.repo.create({ ...dto, language, business: business ?? null });
    const saved = await this.repo.save(task);
    await this.audit.record({ action: "task.created", taskId: saved.id, actorId: business?.id ?? null, message: "Задача создана" });
    return saved;
  }

  async updateBusinessTask(userId: number, id: number, dto: Partial<Task>) {
    const task = await this.repo.findOne({ where: { id, business: { id: userId } as any }, relations: ["business"] });
    if (!task) throw new NotFoundException("Задача не найдена");
    if (![TaskStatus.PENDING, TaskStatus.REJECTED].includes(task.status)) throw new NotFoundException("Эту задачу нельзя редактировать в текущем статусе");
    let language: string | null = null;
    try { language = validateTaskLanguage(dto.language); } catch (e: any) { throw new BadRequestException(e?.message || "Выберите язык программирования"); }
    Object.assign(task, { ...dto, language });
    task.status = TaskStatus.PENDING;
    task.moderationMessage = null;
    const saved = await this.repo.save(task);
    await this.audit.record({ action: "task.resubmitted", taskId: id, actorId: userId, message: "Задача повторно отправлена на модерацию" });
    return saved;
  }

  async deleteBusinessTask(userId: number, id: number) {
    const task = await this.repo.findOne({ where: { id, business: { id: userId } as any }, relations: ["business"] });
    if (!task) throw new NotFoundException("Задача не найдена");
    if (![TaskStatus.PENDING, TaskStatus.REJECTED].includes(task.status)) throw new NotFoundException("Эту задачу нельзя удалить в текущем статусе");
    await this.repo.remove(task);
    return { ok: true };
  }

  async updateTask(id: number, dto: Partial<Task>) {
    const task = await this.findOne(id);
    if (!task) throw new NotFoundException("Task not found");
    if (dto.language !== undefined) {
      try { dto.language = validateTaskLanguage(dto.language) as any; } catch (e: any) { throw new BadRequestException(e?.message || "Выберите язык программирования"); }
    }
    Object.assign(task, dto);
    return this.repo.save(task);
  }

  async moderate(id: number, status: TaskStatus, message?: string) {
    const task = await this.findOne(id);
    if (!task) throw new NotFoundException("Task not found");
    task.status = status;
    task.moderationMessage = message?.trim() || null;
    const saved = await this.repo.save(task);
    await this.audit.record({ action: `task.${status}`, taskId: id, message: message?.trim() || null });
    return saved;
  }

  async deleteTask(id: number) {
    const task = await this.findOne(id);
    if (!task) throw new NotFoundException("Task not found");
    await this.repo.remove(task);
    return { ok: true };
  }
}
