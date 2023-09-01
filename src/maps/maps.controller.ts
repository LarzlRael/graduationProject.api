import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Res,
  HttpStatus,
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
  ) { }

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
  async getQuery(@Res() res: Response) {
    const result = await this.mapsService.executeQuery(
      `SELECT *, st_x(geometry) as lng, st_y(geometry) as lat  FROM   fire_one_year WHERE acq_date='2020-10-11';`,
    );

    return res.json(result);
  }
  @Get('getbyDate/:date')
  async getHeatSourcesByDate(@Res() res: Response, @Param('date') date) {
    const result = await this.mapsService.getHeatSourcesByDate(date);
    return res.json(result);
  }

  @Post('getbybetweendate')
  async getbyBetweenDate(@Res() res: Response, @Body() mapDto: MapDto) {
    const result = await this.mapsService.getHeatSourcesByBetweenDate(mapDto);
    return res.json(result);
  }

  @Get('getdepartamento/:departamento')
  async getDepartamentPolygon(
    @Res() res: Response,
    @Param('departamento') departamento,
  ) {
    const result = await this.mapsService.getDepartamentPolygon(departamento);
    return res.json(result);
  }

  @Post('getheatsourcesbydeparment')
  async getHeatSourcesByDeparment(
    @Res() res: Response,
    @Body() mapDto: MapDto,
  ) {
    const result = await this.mapsService.getHeatSourcesByDeparment(mapDto);
    return res.json(result);
  }

  @Post('getheatsourcesbyprovincia')
  async getHeatSourcesByProvincia(
    @Res() res: Response,
    @Body() mapDto: MapDto,
  ) {

    const result = await this.mapsService.getHeatSourcesByProvincia(mapDto);
    return res.json(result);
  }

  @Get('getmidPoint/:location/:name')
  async getMidPoint(
    @Res() res: Response,
    @Param('location') location,
    @Param('name') name,
  ) {
    const result = await this.mapsService.getMiddlePoint(location, name);
    return res.json(result);
  }

  @Post('getheatsourcesbymunicipio')
  async getHeatSourcesByMunicipio(
    @Res() res: Response,
    @Body() mapDto: MapDto,
  ) {
    const result = await this.mapsService.getHeatSourcesByMunicipio(mapDto);
    return res.json(result);
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
