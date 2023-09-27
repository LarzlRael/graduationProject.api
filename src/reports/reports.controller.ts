import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { unlinkSync } from 'fs';
import { ReportDto } from './dto/report.dto';
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('getreportcvs')
  getReportCVS(@Body() reportDto: ReportDto) {
    return this.reportsService.getReportCVS(reportDto);
  }

  @Post('geojsonreport')
  geoJsonReport(@Body() reportDto: ReportDto) {
    return this.reportsService.getReportGeoJSON(reportDto);
  }
  @Post('getshapefile')
  async getShapeFIle(@Res() res: Response, @Body() reportDto: ReportDto) {
    const shapeFilePath = await this.reportsService.convertGeoJsonToshapFile(
      reportDto,
    );
    return res.download(shapeFilePath.shapeFilePath, function () {
      unlinkSync(shapeFilePath.shapeFilePath);
      unlinkSync(shapeFilePath.geoJsonPath);
    });
  }
}
