import { Injectable } from '@nestjs/common';
import { CreateCrudDto } from './dto/create-crud.dto';
import { UpdateCrudDto } from './dto/update-crud.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Crud } from './entities/crud.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CrudService {
  constructor(
    @InjectRepository(Crud)
    private readonly crudRepository: Repository<Crud>,
  ) { }
  create(createCrudDto: CreateCrudDto) {
    const crud = this.crudRepository.create(createCrudDto)
    return this.crudRepository.save(crud)
  }

  findAll() {
    return `This action returns all crud`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crud`;
  }

  update(id: number, updateCrudDto: UpdateCrudDto) {
    return `This action updates a #${id} crud`;
  }

  remove(id: number) {
    return `This action removes a #${id} crud`;
  }
}
