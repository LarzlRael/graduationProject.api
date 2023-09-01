import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { OrderBy, Departamento } from '../../maps/dto/orderBy';

export class AnalysisDto {
  dateStart: Date;
  dateEnd: Date;
  provincia: string;
  municipio: string;
  @IsOptional()
  @IsEnum(Departamento)
  departamento: Departamento;

  limit: number;
  @IsEnum(OrderBy)
  @IsOptional()
  orderBy: OrderBy;
}

export class CountDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  month: number;
}