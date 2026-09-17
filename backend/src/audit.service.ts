import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditEvent } from "./audit.entity";

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditEvent) private readonly repo: Repository<AuditEvent>) {}

  async record(params: {
    action: string;
    taskId?: number | null;
    submissionId?: number | null;
    actorId?: number | null;
    message?: string | null;
  }) {
    const event = this.repo.create({
      action: params.action,
      task: params.taskId ? ({ id: params.taskId } as any) : null,
      submission: params.submissionId ? ({ id: params.submissionId } as any) : null,
      actor: params.actorId ? ({ id: params.actorId } as any) : null,
      message: params.message?.trim() || null,
    });
    return this.repo.save(event);
  }

  async forTask(taskId: number) {
    return this.repo.find({
      where: { task: { id: taskId } as any },
      relations: ["actor"],
      order: { createdAt: "ASC" },
    });
  }

  async forSubmission(submissionId: number) {
    return this.repo.find({
      where: { submission: { id: submissionId } as any },
      relations: ["actor"],
      order: { createdAt: "ASC" },
    });
  }
}
