import { Controller, Get, Param, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { unlinkSync } from 'fs';
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) { }

  @Get('getreportcvs/:dateStart/:dateEnd')
  async getReportCVS(
    @Res() res: Response,
    @Param('dateStart') dateStart,
    @Param('dateEnd') dateEnd,
  ) {
    const report = await this.reportsService.getReportCVS(dateStart, dateEnd);
    if (report.ok) {
      return res.json({
        ok: true,
        csv: report.filename,
      });
    } else {
      return res.json({
        ok: false,
        mensaje: 'No se econtraron registro de focos de calor en esa fecha',
      });
    }
  }

  @Get('geojsonreport/:dateStart/:dateEnd')
  async geoJsonReport(
    @Res() res: Response,
    @Param('dateStart') dateStart,
    @Param('dateEnd') dateEnd,
  ) {
    const report = await this.reportsService.getReportGeoJSON(
      dateStart,
      dateEnd,
    );
    return res.json(report);
  }
  @Get('getshapefile/:dateStart/:dateEnd')
  async getShapeFIle(
    @Res() res: Response,
    @Param('dateStart') dateStart,
    @Param('dateEnd') dateEnd,
  ) {
    const shapeFilePath = await this.reportsService.convertGeoJsonToshapFile(
      dateStart,
      dateEnd,
    );
    return res.download(shapeFilePath.shapeFilePath, function () {
      unlinkSync(shapeFilePath.shapeFilePath);
      unlinkSync(shapeFilePath.geoJsonPath);
    });
  }
}
