import { Injectable, Inject } from '@nestjs/common';
import * as moment from 'moment';
import { Pool } from 'pg';
import { departamentos, fire_history, municipios } from 'src/tables';
import { AnalysisDto, CountDto } from './dto/analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getFirstAndLastDate() {
    const query = `SELECT MIN(acq_date) AS min_date, MAX(acq_date) AS max_date FROM ${fire_history};`;

    const res = await this.pool.query(query);
    const { min_date, max_date } = res.rows[0];

    return {
      min_date,
      max_date,
    };
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
    const dateRangeQuery = `
    SELECT
     min(acq_date) AS min_date,
     max(acq_date) AS max_date
    FROM
      ${fire_history};
  `;
    const result = await this.pool.query(dateRangeQuery);

    const startDate = moment(result.rows[0].min_date);
    const endDate = moment(result.rows[0].max_date);

    const getAvailablesMounts = `
    SELECT date_trunc('day', dd):: date
    FROM generate_series
      ('${startDate}':: timestamp,
       '${endDate}':: timestamp,
        '1 month':: interval) dd
      ;
      `;
    const execute = await this.pool.query(getAvailablesMounts);

    const array = [];
    execute.rows.map((row) => {
      const date = moment(row.date_trunc);

      if (date.month() + 1 == 1) {
        array.push({
          month: 0,
          year: date.year(),
        });
      }
      array.push({
        month: date.month() + 1,
        year: date.year(),
      });
    });

    return array.reverse();
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
    const query = `select nombre_provincia from provincias
    where departamento = $1 order by nombre_provincia ASC`;

    const res = await this.pool.query(query, [nombreDepartamento]);
    return res.rows;
  }
  async getNamesMunicipios(nombreDepartamento: string) {
    const query = `select nombre_municipio, provincia from ${municipios.tableName}
    where departamento = $1 order by nombre_municipio ASC`;

    const res = await this.pool.query(query, [nombreDepartamento]);
    return res.rows;
  }

  async getNamesNombresProvincias(nombreDepartamento: string) {
    try {
      const [provinciasResult, municipiosResult] = await Promise.all([
        this.getNamesProvincias(nombreDepartamento),
        this.getNamesMunicipios(nombreDepartamento),
      ]);
      return {
        provincias: provinciasResult.map((row) => row.nombre_provincia),
        municipios: municipiosResult.map((row) => row.nombre_municipio),
      };
    } catch (error) {}
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
  async getCountByDepartamentosByType(analysisDto: AnalysisDto) {
    if (analysisDto.type === 'municipio') {
      return this.getCountDepartamentosMunicipios(analysisDto);
    }
    if (analysisDto.type === 'provincia') {
      return this.getCountDepartamentosProvincias(analysisDto);
    }
    if (analysisDto.type === 'departamento') {
      return this.getCountDepartamentos(analysisDto);
    }
  }

  async getCountDepartamentosProvincias(analysisDto: AnalysisDto) {
    console.log('getCountProv');
    console.log(analysisDto);

    const query = `
    SELECT
    b.nombre_provincia AS nombre,
    (
        SELECT COUNT(*)
        FROM fire_history AS a
        WHERE ST_WITHIN(a.geometry, b.geom)
        AND a.acq_date BETWEEN $1 AND $2
    ) AS focos_calor
  FROM
    provincias AS b
  WHERE
    b.departamento IN ($3)
      ORDER BY
    focos_calor DESC; 
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
    SELECT
    nombre_municipio AS nombre,
    focos_calor
FROM
    (
        SELECT
            b.nombre_municipio,
            COUNT(*) AS focos_calor
        FROM
            fire_history AS a
        JOIN
            municipios AS b
        ON
            ST_WITHIN(a.geometry, b.geom)
        WHERE
            a.acq_date BETWEEN $1 AND $2
            AND b.departamento IN ($3)
        GROUP BY
            b.nombre_municipio
    ) AS subconsulta
ORDER BY
    focos_calor DESC;
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
    SELECT
    nombre,
    focos_calor
FROM
    (
        SELECT
            b.nombre_departamento AS nombre,
            COUNT(*) AS focos_calor
        FROM
            fire_history AS a
        JOIN
            departamentos AS b
        ON
            ST_WITHIN(a.geometry, b.geom)
        WHERE
            a.acq_date BETWEEN $1 AND $2
        GROUP BY
            b.nombre_departamento
    ) AS subconsulta
ORDER BY
    focos_calor DESC;

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
