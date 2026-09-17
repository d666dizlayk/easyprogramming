import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "../users/user.entity";

export enum TaskDifficulty { EASY = "easy", MEDIUM = "medium", HARD = "hard" }
export enum TaskStatus {
  PENDING = "pending",
  APPROVED = "approved",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

type TestCase = { input: any[]; output: any };

@Entity()
export class Task {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column("text") description: string;
  @Column({ type: "enum", enum: TaskDifficulty, default: TaskDifficulty.EASY }) difficulty: TaskDifficulty;
  @Column({ default: "solution" }) functionName: string;
  @Column("text", { default: "function solution() {\n  // TODO\n}\n\nmodule.exports = solution;\n" }) starterCode: string;
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" }) publicTests: TestCase[];
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" }) hiddenTests: TestCase[];
  @CreateDateColumn() createdAt: Date;
  @Column({ type: "text", nullable: true }) goal: string | null;
  @Column({ type: "text", nullable: true }) conditions: string | null;
  @Column({ type: "varchar", length: 50, nullable: true }) language: string | null;

  @Column({ type: "enum", enum: TaskStatus, default: TaskStatus.APPROVED })
  status: TaskStatus;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: "SET NULL" })
  business: User | null;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: "SET NULL" })
  assignedProgrammer: User | null;

  @Column({ type: "text", nullable: true }) moderationMessage: string | null;
}
