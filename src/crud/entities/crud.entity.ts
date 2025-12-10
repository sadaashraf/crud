import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Crud {

  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publish: string;

  @Column()
  year: number;

}
