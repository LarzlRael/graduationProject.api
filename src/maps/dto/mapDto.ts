import { IsEnum, IsOptional } from 'class-validator';
import { OrderBy, Departamento } from './orderBy';

export class MapDto {
  dateNow: Date;
  dateStart: Date;
  dateEnd: Date;
  provincia: string;
  municipio: string;
  @IsOptional()
  @IsEnum(Departamento)
  departamento: Departamento;

}
