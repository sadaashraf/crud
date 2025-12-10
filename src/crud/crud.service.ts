import { Injectable, NotFoundException } from '@nestjs/common';
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
    const crud = this.crudRepository.find()
    return crud;
  }

  findOne(id: number) {
    const crud = this.crudRepository.findOneBy({ id })
    return crud

  }

  async update(id: number, updateCrudDto: UpdateCrudDto) {
    const crud = await this.crudRepository.findOneBy({ id })
    if (!crud) {
      return new NotFoundException('id not found')
    }
    Object.assign(crud, updateCrudDto)
    return this.crudRepository.save(crud)
  }

  async remove(id: number) {
    const crud = await this.crudRepository.findOneBy({ id })
    if (!crud) {
      return new NotFoundException('id not found')

    }
    await this.crudRepository.remove(crud)
    return {
      message: "deleted successfully"
    }

  }
}
