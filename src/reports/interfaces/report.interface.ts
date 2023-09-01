enum ReportFormatENUM {
  GEOJSON,
  CVS,
  SHAPEFILE,
}
export interface Report {
  latitude: number;
  longitude: number;
  brightness: number;
  acq_date: Date;
  acq_time: number;
  satellite: Satellite;
  instrument: string;
  version: Version;
  bright_t31: number;
  confidence: number;
  frp: number;
  type?: string | number;
  daynight?: string;
}

export enum Satellite {
  Aqua = 'Aqua',
  Terra = 'Terra',
}

export enum Version {
  The61Nrt = '6.1NRT',
}