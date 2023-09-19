import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Res,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MapsService } from './maps.service';
import { MapDto } from './dto/mapDto';
import { join } from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cvsFilter, editFileName, formatFileCsv } from './utils/utils';
import { diskStorage } from 'multer';
import { readFile, writeFile, unlink, writeFileSync } from 'fs';

import { stringify } from 'csv/sync';
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

  @Get('getmidPoint/:location/:name')
  getMidPoint(@Param('location') location, @Param('name') name) {
    return this.mapsService.getMiddlePoint(location, name);
  }

  /* @Post('getheatsourcesbymunicipio')
  getHeatSourcesByMunicipio(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByMunicipio(mapDto);
  }

  @Post('getheatsourcesbyprovincia')
  getHeatSourcesByProvincia(@Body() mapDto: MapDto) {
    return this.mapsService.getHeatSourcesByProvincia(mapDto);
  } */
  @Post('get_heat_sources_by_type')
  getHeatSourcesByType(@Body() mapDto: MapDto) {
    console.log(mapDto);
    return this.mapsService.getHeatSourcesByType(mapDto);
  }

  @Post('getHeatSourcesAllByType')
  getHeatSourcesAllByType(@Body() mapDto: MapDto) {
    console.log(mapDto);
    return this.mapsService.getHeatSourcesByAllType(mapDto);
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
    console.log(files);
    files.forEach(async (file) => {
      const pathIn = join(__dirname, '../../', `files/${file.filename}`);
      // Load and parsing data

      const {
        data,
        firstAcqDate,
        lastAcqDate,
        instrument,
      } = await formatFileCsv(pathIn);
      //Save
      const verify = await this.analisysServices.verifyDatesDB(
        firstAcqDate,
        lastAcqDate,
        instrument,
      );

      const pathOut = join(__dirname, '../../', `files/cvsconvertido.csv`);
      writeFileSync(
        pathOut,
        stringify(data, { header: false, quoted: false }),
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

      if (!verify) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: 'BAD REQUEST',
          message: 'La base de datos ya ha sido actualizada',
        });
      }
      const verifyInsertion = await this.mapsService.saveNewData(pathOut);
      if (verifyInsertion) {
        res.status(HttpStatus.OK).json({
          status: 'BAD REQUEST',
          message: 'Datos subidos y actualizados correctamente',
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: 'BAD REQUEST',
          message: 'hubo un error al actualizar la base de datos',
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
