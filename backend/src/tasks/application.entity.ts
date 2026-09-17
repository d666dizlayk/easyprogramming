import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/user.entity";
import { Task } from "./task.entity";

export enum ApplicationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity()
export class TaskApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, { eager: false, onDelete: "CASCADE" })
  task: Task;

  @ManyToOne(() => User, { eager: false, onDelete: "CASCADE" })
  programmer: User;

  @Column({ type: "text", nullable: true })
  message: string | null;

  @Column({ type: "enum", enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
