import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./notifications.entity";
import { User } from "./users/user.entity";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(params: { userId: number; type: string; title: string; message: string; taskId?: number | null; submissionId?: number | null }) {
    const user = await this.users.findOne({ where: { id: params.userId } });
    if (!user) return null;
    return this.repo.save(this.repo.create({
      user,
      type: params.type,
      title: params.title,
      message: params.message,
      taskId: params.taskId ?? null,
      submissionId: params.submissionId ?? null,
      read: false,
    }));
  }

  async createForAdmins(params: { type: string; title: string; message: string; taskId?: number | null; submissionId?: number | null }) {
    const admins = await this.users.find({ where: { isAdmin: true } });
    if (!admins.length) return [];

    const notifications = admins.map((user) =>
      this.repo.create({
        user,
        type: params.type,
        title: params.title,
        message: params.message,
        taskId: params.taskId ?? null,
        submissionId: params.submissionId ?? null,
        read: false,
      }),
    );

    return this.repo.save(notifications);
  }

  async listForUser(userId: number) {
    return this.repo.find({ where: { user: { id: userId } as any }, order: { createdAt: "DESC" }, take: 50 });
  }

  async unreadCount(userId: number) {
    return this.repo.count({ where: { user: { id: userId } as any, read: false } });
  }

  async markRead(userId: number, id: number) {
    await this.repo.update({ id, user: { id: userId } as any }, { read: true });
    return { ok: true };
  }

  async markAllRead(userId: number) {
    await this.repo.update({ user: { id: userId } as any, read: false }, { read: true });
    return { ok: true };
  }
}
