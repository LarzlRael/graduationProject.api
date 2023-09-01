import { Injectable, Inject } from '@nestjs/common';
import * as moment from 'moment';
import { Pool } from 'pg';
import {
  departamentos,
  fire_history,
  municipios,
  provincias,
} from 'src/tables';
import { AnalysisDto, CountDto } from './dto/analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getFirstAndLastDate(): Promise<string[]> {
    const from = `select acq_date from ${fire_history} order by acq_date DESC limit 1 ;`;
    const to = `select acq_date from ${fire_history} order by acq_date ASC limit 1 ;`;

    const res1 = await this.pool.query(from);
    const res2 = await this.pool.query(to);
    return [res2.rows[0].acq_date, res1.rows[0].acq_date];
  }
  async verifyDatesDB(datestart: Date, dateEnd: Date, instrument: string) {
    const verify = `select count(acq_date) as cantidad from fire_history where instrument=$1 and acq_date BETWEEN $2 and $3`;
    const resp = await this.pool.query(verify, [
      instrument,
      moment(datestart).add(8, 'hours'),
      moment(dateEnd).add(8, 'hours'),
    ]);

    return resp.rows[0].cantidad == 0;
  }
  async getMonthYearAvailabes() {
    const from = `select acq_date from ${fire_history} order by acq_date ASC limit 1 ;`;
    const to = `select acq_date from ${fire_history} order by acq_date DESC limit 1 ;`;

    const res1 = await this.pool.query(from);
    const res2 = await this.pool.query(to);

    const getAvailablesMounts = `
    SELECT date_trunc('day', dd):: date
    FROM generate_series
      ('${moment(res1.rows[0].acq_date).utc().format('YYYY-MM-DD')}':: timestamp
        , '${moment(res2.rows[0].acq_date)
          .utc()
          .format('YYYY-MM-DD')}':: timestamp
        , '1 month':: interval) dd
      ;
      `;
    const execute = await this.pool.query(getAvailablesMounts);
    const array = [];
    execute.rows.map((row) => {
      const month = moment(row.date_trunc).utc().format('MM');
      const year = moment(row.date_trunc).utc().format('YYYY');
      const date = moment(row.date_trunc).utc().format('MM-YYYY');
      if (parseInt(date.split('-')[0]) === 1) {
        array.push({
          month: 0,
          year: parseInt(date.split('-')[1]),
        });
      }
      array.push({
        month: parseInt(month),
        year: parseInt(year),
      });
    });

    return array.reverse();
  }

  async getDateFromDatabase(count: number, from: number): Promise<string[]> {
    const queryText = `SELECT distinct acq_date from ${fire_history} order by acq_date DESC limit $1 offset $2;`;
    const res = await this.pool.query(queryText, [count, from]);
    const rowsJson = res.rows;
    const array = [];
    rowsJson.map((row) => {
      array.push(row.acq_date);
    });
    return array;
  }

  async getNHeatSourceByDepartament(analysisDto: AnalysisDto) {
    const query = `select a.longitude as lng, a.latitude as lat, a.brightness
    from ${fire_history} as a
    join ${departamentos.tableName} as b
    on ST_WITHIN(a.geometry, b.geom) where (a.acq_date BETWEEN $1 and $2
    and b.nombre_departamento in ($3)) ORDER BY a.brightness ${analysisDto.orderBy} limit $4`;

    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
      analysisDto.departamento,
      analysisDto.limit,
    ]);
    return res.rows;
  }

  async getNamesProvincias(nombreDepartamento: string) {
    const query = `select nombre_provincia,departamento from provincias
    where departamento = $1 order by nombre_provincia ASC`;

    const res = await this.pool.query(query, [nombreDepartamento]);
    return res.rows;
  }
  async getNamesMunicipios(nombreDepartamento: string) {
    const query = `select nombre_municipio, provincia, departamento from ${municipios.tableName}
    where departamento = $1 order by nombre_municipio ASC`;

    const res = await this.pool.query(query, [nombreDepartamento]);
    return res.rows;
  }

  async getHeatSourcesByProvincia(analysisDto: AnalysisDto) {
    const query = `
    select a.longitude,a.latitude,a.brightness,b.nombre_provincia,b.departamento
    from fire_history as a
    join provincias as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN $1
    and $2 and b.departamento in ($3))
    `;
    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
      analysisDto.departamento,
    ]);
    return res.rows;
  }

  async getHeatSourcesByMunicio(analysisDto: AnalysisDto) {
    const query = `
    select a.longitude as lng, a.latitude as lat, a.brightness
    from fire_history as a
    join municipios as b
    on ST_WITHIN(a.geometry, b.geom) where
    (a.acq_date BETWEEN $1 and $2 and b.nombre_municipio in ($3));
    `;
    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
      analysisDto.municipio,
    ]);
    return res.rows;
  }

  async getCountDepartamentosProvincias(analysisDto: AnalysisDto) {
    const query = `
    select b.nombre_provincia as nombre, count(b.nombre_provincia) as focos_calor
    from fire_history as a
    join provincias as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN $1
    and $2 and b.departamento in ($3)) GROUP by(b.nombre_provincia) order by focos_calor DESC 
    `;
    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
      analysisDto.departamento,
    ]);
    return res.rows;
  }

  async getCountDepartamentosMunicipios(analysisDto: AnalysisDto) {
    console.log(analysisDto);
    const query = `
    select b.nombre_municipio as nombre, count(b.nombre_municipio) as focos_calor
    from fire_history as a
    join municipios as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN 
    $1 and $2 and b.departamento in ($3)) 
    GROUP by(b.nombre_municipio) order by focos_calor DESC
    `;
    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
      analysisDto.departamento,
    ]);
    return res.rows;
  }
  async getCountDepartamentos(analysisDto: AnalysisDto) {
    const query = `
    select b.nombre_departamento as nombre, count(b.nombre_departamento) as focos_calor
    from fire_history as a
    join departamentos as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN $1 and $2) 
    GROUP by(b.nombre_departamento) order by focos_calor DESC
    `;
    const res = await this.pool.query(query, [
      analysisDto.dateStart,
      analysisDto.dateEnd,
    ]);
    return res.rows;
  }
  async getCountHeatSourcesByMonth(countDto: CountDto) {
    const query = `
    select count(brightness) as focos_calor ,acq_date from fire_history 
    where extract(year from acq_date) = $1 and extract(month from acq_date) = $2 group by acq_date;
    `;
    const res = await this.pool.query(query, [countDto.year, countDto.month]);
    return res.rows;
  }

  async getCountHeatSourceByMonths(countDto: CountDto) {
    const query = `
    select count(brightness) as focos_calor,extract(MONTH from acq_date) as mes from fire_history 
    where  extract(year from acq_date) = $1 group by mes`;
    const res = await this.pool.query(query, [countDto.year]);
    return res.rows;
  }
}
