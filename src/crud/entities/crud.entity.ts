import { Column } from "typeorm";

export class Crud {

  @Column()
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
