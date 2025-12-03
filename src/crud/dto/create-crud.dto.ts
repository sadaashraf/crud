import { IsNotEmpty, IsNumber, IsString } from "class-validator"
export class CreateCrudDto {

  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  publish: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

}
