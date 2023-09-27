/* eslint-disable prettier/prettier */
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { fire_history } from 'src/tables';
import { GeoJsonResponse } from './interfaces/geoJson.interface';
import { Report } from './interfaces/report.interface';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convert } = require('geojson2shp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GeoJSON = require('geojson');
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ReportDto } from './dto/report.dto';

const setFileName = (dateStart: string, dateEnd: string): string => {
  const newDate1 = dateStart.split('-');
  const newDate2 = dateEnd.split('-');
  if (dateStart === dateEnd) {
    return `${newDate1[2]}-${newDate1[1]}-${newDate1[0]}`;
  } else {
    return `${newDate1[2]}${newDate1[1]}${newDate1[0]}-${newDate2[2]}${newDate2[1]}${newDate2[0]}`;
  }
};

@Injectable()
export class ReportsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getReportCVS(reportDto: ReportDto): Promise<string> {
    const { dateStart, dateEnd } = reportDto;

    const queryText = `SELECT latitude, longitude ,brightness,acq_date,acq_time,satellite, instrument, version, bright_t31,confidence,frp  from ${fire_history}
    WHERE acq_date  BETWEEN '${dateStart}' AND '${
      dateEnd || dateStart
    }' order by brightness DESC;`;
    console.log(reportDto);
    const getReport = await this.pool.query(queryText);
    const format: Report[] = getReport.rows;
    console.log(format);
    if (format.length == 0) {
      return '';
    }

    let cvs = '';
    cvs +=
      'latitude,longitude,brightness,acq_date,acq_time,satellite,instrument,version,bright_t31,confidence,frp,vcs\n';

    format.map(
      ({
        latitude,
        longitude,
        brightness,
        instrument,
        confidence,
        satellite,
        version,
        bright_t31,
        frp,
        acq_time,
        acq_date,
      }) => {
        cvs +=
          `${latitude},${longitude},${brightness},${acq_date
            .toISOString()
            .slice(
              0,
              10,
            )},${acq_time},${satellite},${instrument},${version},${bright_t31},${confidence},${frp}` +
          '\n';
      },
    );

    return cvs;
  }

  async getReportGeoJSON(reportDto: ReportDto) {
    const { dateStart, dateEnd } = reportDto;
    const query = `SELECT *, ST_X(geometry) as lng, ST_Y(geometry) as lat FROM ${fire_history} WHERE acq_date BETWEEN '${dateStart}' AND '${
      dateEnd || dateStart
    }' ORDER BY brightness DESC;`;

    const res = await this.pool.query(query);
    if (res.rows.length == 0) {
      return {
        ok: false,
        filename: '',
      };
    }
    const geojson: GeoJsonResponse = await GeoJSON.parse(res.rows, {
      Point: ['lat', 'lng'],
    });
    return geojson;
  }

  /*  generateReport(dataContent: string, format: keyof typeof ReportFormatENUM, startDate: string, endDate?: string): string {
 
     let filename = '';
     let extension = '';
     switch (format) {
       case 'GEOJSON':
         extension = 'geojson';
         break;
       case 'CVS':
         extension = 'csv';
         break;
       default:
         extension = 'geojson';
         break;
     }
     if (endDate !== undefined) {
       filename = `reporte ${convertirFecha(startDate, true)}-${convertirFecha(endDate, true)}.${extension}`
     } else {
       console.log('date 1 parameter ' + startDate);
       filename = `reporte ${convertirFecha(startDate, false)}.${extension}`
     }
     appendFile(`public/${filename}`, dataContent, (err) => {
       if (err) throw err;
       console.log('The "data to append" was appended to file!');
     });
     return filename;
   } */

  async convertGeoJsonToshapFile(
    reportDto: ReportDto,
  ): Promise<{
    shapeFilePath: string;
    geoJsonPath: string;
  }> {
    const { dateStart, dateEnd } = reportDto;
    const nameFileName = ` ${setFileName(
      dateStart.toString(),
      dateEnd.toString(),
    )}`;

    const options = {
      layer: nameFileName,
      targetCrs: 4326,
    };

    const geoJsonPath = join(__dirname, '..', `../public/${uuidv4()}.geojson`);
    const shapeFilePath = join(
      __dirname,
      '..',
      `../public/${nameFileName}.zip`,
    );

    const getGeoJsonInfo = await this.getReportGeoJSON(reportDto);

    await writeFileSync(geoJsonPath, JSON.stringify(getGeoJsonInfo));
    await convert(geoJsonPath, shapeFilePath, options);
    return { shapeFilePath, geoJsonPath };
  }

  /* async getInfoByDepartament(dateStart: string, dateEntd?: string) {} */
}
