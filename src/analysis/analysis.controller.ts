import { Controller, Get, Res, Param, Body, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { Response } from 'express';
import { AnalysisDto, CountDto } from './dto/analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}
  @Get('dates')
  async getFirstAndLastDate(@Res() res: Response) {
    const dates = await this.analysisService.getFirstAndLastDate();
    res.json({
      ok: true,
      dates,
    });
  }
  @Get('available-mounth')
  async getMonthYearAvailabes(@Res() res: Response) {
    const years = await this.analysisService.getMonthYearAvailabes();
    res.json({
      ok: true,
      years,
    });
  }

  @Post('getnheatsourcebydepartament')
  async getNHeatSourceByDepartament(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getNHeatSourceByDepartament(
      analysisDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Get('nombres_provincias/:departamento')
  async getNamesProvincias(
    @Res() res: Response,
    @Param('departamento') departamento,
  ) {
    const resp = await this.analysisService.getNamesProvincias(departamento);
    return res.json({
      ok: true,
      resp,
    });
  }
  @Get('nombres_municipios/:departamento')
  async getNombresProvincias(
    @Res() res: Response,
    @Param('departamento') departamento,
  ) {
    const resp = await this.analysisService.getNamesMunicipios(departamento);
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('getheatsourcesbyprovincia')
  async getHeatSourcesByProvincia(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getHeatSourcesByProvincia(
      analysisDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('getheatsourcesbymunicio')
  async getHeatSourcesByMunicio(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getHeatSourcesByMunicio(
      analysisDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('countdepartamentosprovincias')
  async getCountDepartamentosProvincias(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getCountDepartamentosProvincias(
      analysisDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('countdepartamentosmunicipios')
  async getCountDepartamentosMunicipios(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getCountDepartamentosMunicipios(
      analysisDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('getcountdepartamentos')
  async getCountDepartamentos(
    @Res() res: Response,
    @Body() analysisDto: AnalysisDto,
  ) {
    const resp = await this.analysisService.getCountDepartamentos(analysisDto);
    return res.json({
      ok: true,
      resp,
    });
  }
  @Post('getcountheatsourcesbymonth')
  async getCountHeatSourcesByMonth(
    @Res() res: Response,
    @Body() countDto: CountDto,
  ) {
    const resp = await this.analysisService.getCountHeatSourcesByMonth(
      countDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }

  @Post('getcountheatsourcesbymonths')
  async getCountHeatSourcesByMonths(
    @Res() res: Response,
    @Body() countDto: CountDto,
  ) {
    const resp = await this.analysisService.getCountHeatSourceByMonths(
      countDto,
    );
    return res.json({
      ok: true,
      resp,
    });
  }
}
