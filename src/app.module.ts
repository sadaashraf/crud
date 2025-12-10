import { Module } from '@nestjs/common';
import { CrudModule } from './crud/crud.module';
import { Crud } from './crud/entities/crud.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'bookdb',
      entities: [Crud],
      synchronize: true,
    }),
    CrudModule
  ],

})

export class AppModule { }
