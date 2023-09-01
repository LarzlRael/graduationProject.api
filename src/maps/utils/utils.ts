import { MapResponse, Feature } from '../interfaces/mapsResponse';
import { extname } from 'path';
import { Report } from '../../reports/interfaces/report.interface';
import { readFileSync } from 'fs';

import * as csv from 'csv/lib/sync';

export const createFileInfoRequest = (features: Feature[]) => {
  const data: MapResponse = {
    type: 'FeatureCollection',
    name: 'FocosdecalorBolivia_2',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features: features,
  };

  return data;
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const cvsFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(csv)$/)) {
    return callback(
      new Error('Solo son permitidos archivos de tipo .csv'),
      false,
    );
  }
  callback(null, true);
};

export const getCurrentDate = (yesterday?: boolean): string => {
  const date = new Date();
  if (yesterday) {
    date.setHours(date.getHours() - 24);
  } else {
    date.setHours(date.getHours() - 4);
  }
  return date.toISOString().slice(0, 10);
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const convertDepartmentsToString = (departamentos: string): string => {
  const departamentosBolivia =
    'La Paz,Oruro,Cochabamba,Tarija,Pando,Santa Cruz,Potosi,Chuquisaca,Beni';
  if (departamentos.toLowerCase() === 'bolivia') {
    const split = departamentosBolivia.split(',');
    let query = '';
    split.map((departamento) => {
      return (query += `'${capitalizeFirstLetter(departamento.trim())}',`);
    });

    return query.substring(0, query.length - 1);
  } else {
    const split = departamentos.split(',');
    let query = '';
    split.map((departamento) => {
      return (query += `'${capitalizeFirstLetter(departamento.trim())}',`);
    });

    return query.substring(0, query.length - 1);
  }
};

export const formatFileCsv = async (pathIn: string) => {
  const strcsv = readFileSync(pathIn, 'utf-8');
  let data: Report[] = [];
  data = (csv.parse as any)(strcsv, {
    bom: true,
    cast: false,
    columns: true,
  });

  data.forEach((simpleData) => {
    if (simpleData.type) {
      delete simpleData.type;
    }
    if (parseInt(simpleData.satellite) === 1) {
      simpleData.instrument = 'VIIRSC2';
    }
    if (typeof simpleData.confidence !== 'number') {
      simpleData.confidence = 0;
    }
  });
  const lastAcqDate = data[data.length - 1];
  const firstAcqDate = data[0];
  return { data, fechas: [firstAcqDate, lastAcqDate] };
};
