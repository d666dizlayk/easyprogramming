import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./users/user.entity";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User, { eager: false, onDelete: "CASCADE" })
  @JoinColumn()
  user: User;
  @Column({ type: "text" }) type: string;
  @Column({ type: "text" }) title: string;
  @Column({ type: "text" }) message: string;
  @Column({ type: "int", nullable: true }) taskId: number | null;
  @Column({ type: "int", nullable: true }) submissionId: number | null;
  @Column({ type: "boolean", default: false }) read: boolean;
  @CreateDateColumn() createdAt: Date;
}
