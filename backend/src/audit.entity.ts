import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users/user.entity";
import { Task } from "./tasks/task.entity";
import { Submission } from "./submissions/submission.entity";

@Entity()
export class AuditEvent {
  @PrimaryGeneratedColumn() id: number;
  @Column() action: string;
  @Column({ type: "text", nullable: true }) message: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: "SET NULL" })
  actor: User | null;

  @ManyToOne(() => Task, { nullable: true, eager: false, onDelete: "CASCADE" })
  task: Task | null;

  @ManyToOne(() => Submission, { nullable: true, eager: false, onDelete: "CASCADE" })
  submission: Submission | null;

  @CreateDateColumn() createdAt: Date;
}
