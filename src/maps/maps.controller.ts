import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Res,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Response } from 'express';
import { MapsService } from './maps.service';
import { MapDto } from './dto/mapDto';
import { join } from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cvsFilter, editFileName, formatFileCsv } from './utils/utils';
import { diskStorage } from 'multer';
import { readFile, writeFile, unlink, readFileSync, writeFileSync } from 'fs';

/* import parse from 'csv-parse/lib/sync'; */
import * as csv from 'csv/lib/sync';
import { Report } from 'src/reports/interfaces/report.interface';
import { AnalysisService } from '../analysis/analysis.service';

@Controller('maps')
export class MapsController {
  constructor(
    private mapsService: MapsService,
    private analisysServices: AnalysisService,
  ) {}

  /* @Get('*')
  showMenu(@Res() res: Response) {
    console.log(join(__dirname, '../..', 'public/main/index.html'));
    res.sendFile(join(__dirname, '../..', 'public/main/index.html')),
      function (err) {
        if (err) {
          res.status(500).send(err);
        }
      };
  } */

  @Get()
  @Render('map/index2')
  geoLog() {
    return { token: 'hello word', email: 'que fue' };
  }

  @Post('mapinfo')
  async getQuery() {
    const result = await this.mapsService.executeQuery(
      `SELECT *, st_x(geometry) as lng, st_y(geometry) as lat  FROM   fire_one_year WHERE acq_date='2020-10-11';`,
    );

    return result;
  }
  @Get('getbyDate/:date')
  getHeatSourcesByDate(@Param('date') date) {
    return this.mapsService.getHeatSourcesByDate(date);
  }

  @Post('getbybetweendate')
  getbyBetweenDate(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByBetweenDate(mapDto);
  }

  @Get('getdepartamento/:departamento')
  getDepartamentPolygon(@Param('departamento') departamento) {
    return this.mapsService.getDepartamentPolygon(departamento);
  }

  @Post('getheatsourcesbydeparment')
  getHeatSourcesByDeparment(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByDeparment(mapDto);
  }

  @Post('getheatsourcesbyprovincia')
  getHeatSourcesByProvincia(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByProvincia(mapDto);
  }

  @Get('getmidPoint/:location/:name')
  getMidPoint(@Param('location') location, @Param('name') name) {
    return this.mapsService.getMiddlePoint(location, name);
  }
  @Get('getDepartmentPoligonoes/:departament')
  getDepartamentPoligones(@Param('departament') departament) {
    return this.mapsService.getDepartamentPoligones(departament);
  }

  @Post('getheatsourcesbymunicipio')
  getHeatSourcesByMunicipio(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByMunicipio(mapDto);
  }

  @Post('uploadcsvupdate')
  @UseInterceptors(
    FilesInterceptor('csv', 3, {
      fileFilter: cvsFilter,
      storage: diskStorage({
        filename: editFileName,
        destination: './files',
      }),
    }),
  )
  async uploadcsvupdated(
    @Res() res: Response,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    files.forEach(async (file) => {
      const pathIn = join(__dirname, '../../', `files/${file.filename}`);
      // Load and parsing data
      const { data, fechas } = await formatFileCsv(pathIn);
      //Save

      const verify = await this.analisysServices.verifyDatesDB(
        new Date(fechas[0].acq_date),
        new Date(fechas[1].acq_date),
        fechas[1].instrument,
      );

      const pathOut = join(__dirname, '../../', `files/cvsconvertido.csv`);
      writeFileSync(
        pathOut,
        (csv.stringify as any)(data, { header: false, quoted: false }),
        'utf-8',
      );

      readFile(pathOut, 'utf8', function (err, data) {
        if (err !== null) {
          console.log(err);
        }
        const linesExceptFirst = data.split('\n').slice(1).join('\n');
        writeFile(pathOut, linesExceptFirst, () =>
          console.log('archivo creado'),
        );
      });

      if (verify) {
        const verifyInsertion = await this.mapsService.saveNewData(pathOut);
        if (verifyInsertion) {
          res.json({
            ok: true,
            msg: 'Datos subidos y actualizados correctamente',
          });
        } else {
          res.json({
            ok: false,
            msg: 'Hubo con error, intenenlo nuevamente',
          });
        }
      } else {
        res.json({
          ok: false,
          msg: 'Error, la base de datos ya fue actualizada',
        });
      }

      unlink(pathIn, (err) => {
        if (err) console.log(err);
        console.log('archivo eliminado corretamente');
      });
      unlink(pathOut, (err) => {
        if (err) {
          console.log(err);
        }
        console.log('archivo eliminado corretamente');
      });
    });
  }
}
