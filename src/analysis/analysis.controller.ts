import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

import { AnalysisDto, CountDto } from './dto/analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}
  @Get('dates')
  getFirstAndLastDate() {
    return this.analysisService.getFirstAndLastDate();
  }
  @Get('available-mounth')
  getMonthYearAvailabes() {
    return this.analysisService.getMonthYearAvailabes();
  }

  @Post('getnheatsourcebydepartament')
  async getNHeatSourceByDepartament(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getNHeatSourceByDepartament(analysisDto);
  }

  @Get('nombres_provincias/:departamento')
  getNamesProvincias(@Param('departamento') departamento) {
    return this.analysisService.getNamesProvincias(departamento);
  }
  @Get('nombres_municipios/:departamento')
  getNombresProvincias(@Param('departamento') departamento) {
    return this.analysisService.getNamesMunicipios(departamento);
  }

  @Post('getheatsourcesbyprovincia')
  getHeatSourcesByProvincia(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getHeatSourcesByProvincia(analysisDto);
  }

  @Post('getheatsourcesbymunicio')
  async getHeatSourcesByMunicio(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getHeatSourcesByMunicio(analysisDto);
  }

  @Post('countdepartamentosprovincias')
  async getCountDepartamentosProvincias(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getCountDepartamentosProvincias(analysisDto);
  }

  @Post('countdepartamentosmunicipios')
  getCountDepartamentosMunicipios(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getCountDepartamentosMunicipios(analysisDto);
  }

  @Post('getcountdepartamentos')
  getCountDepartamentos(@Body() analysisDto: AnalysisDto) {
    return this.analysisService.getCountDepartamentos(analysisDto);
  }
  @Post('getcountheatsourcesbymonth')
  getCountHeatSourcesByMonth(@Body() countDto: CountDto) {
    return this.analysisService.getCountHeatSourcesByMonth(countDto);
  }

  @Post('getcountheatsourcesbymonths')
  getCountHeatSourcesByMonths(@Body() countDto: CountDto) {
    return this.analysisService.getCountHeatSourceByMonths(countDto);
  }
}
