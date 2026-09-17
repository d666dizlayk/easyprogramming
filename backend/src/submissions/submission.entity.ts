import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "../users/user.entity";
import { Task } from "../tasks/task.entity";

export type SubmissionStatus =
  | "pending"
  | "passed"
  | "failed"
  | "error"
  | "timeout";

@Entity()
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: false })
  user: User;

  @ManyToOne(() => Task, { eager: true })
  task: Task;

  @Column({ type: "varchar" })
  status: SubmissionStatus;

  @Column({ type: "text", nullable: true })
  message: string | null;

  @Column({ type: "text", nullable: true })
  moderationMessage: string | null;

  @Column({ type: "int", default: 0 })
  passedCount: number;

  @Column({ type: "int", default: 0 })
  totalCount: number;

  @Column({ type: "text", nullable: true })
  code: string | null;

  @Column({ type: "text", nullable: true })
  githubUrl: string | null;

  @Column({ type: "int", nullable: true })
  durationMs: number | null;

  @CreateDateColumn()
  createdAt: Date;
}