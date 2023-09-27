export class ReportDto {
  dateStart: Date;
  dateEnd: Date;
  reportType: 'csv' | 'geojson' | 'shapefile';
}
