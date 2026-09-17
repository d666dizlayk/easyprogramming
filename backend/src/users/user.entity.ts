import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum UserRole {
  PROGRAMMER = "programmer",
  BUSINESS = "business",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.PROGRAMMER })
  role: UserRole;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  stack: string[];

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true, default: "default-avatar.png" })
  avatar: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: 0 })
  exp: number;
}
