import { IsEnum, IsOptional } from 'class-validator';
import { Departamento, TypeLocation } from './orderBy';

export class MapDto {
  dateNow: Date;
  dateStart: Date;
  dateEnd: Date;

  @IsOptional()
  @IsEnum(TypeLocation)
  typeLocation: TypeLocation;

  nameLocation: string;

  /* provincia: string;
  municipio: string; */
  @IsOptional()
  @IsEnum(Departamento)
  departamento: Departamento;
}
