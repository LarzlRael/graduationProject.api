import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { MapDto } from './dto/mapDto';
import { createFileInfoRequest } from './utils/utils';

import { MapResponse } from './interfaces/mapsResponse';
import { departamentos, fire_history } from 'src/tables';
import { TypeLocation } from './dto/orderBy';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GeoJSON = require('geojson');

@Injectable()
export class MapsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async executeQuery(queryText: string) {
    const res = await this.pool.query(queryText);
    const geojson = await GeoJSON.parse(res.rows, { Point: ['lat', 'lng'] });
    return geojson;
  }

  async getHeatSourcesByDate(date: string) {
    const query = `SELECT *, st_x(geometry) as lng, st_y(geometry) as lat  FROM ${fire_history} WHERE acq_date = '${date}' `;
    return this.saveJsonAndParseAsGeoJson(query);
  }

  async getHeatSourcesByBetweenDate(mapdto: MapDto): Promise<MapResponse> {
    const query = `
    SELECT distinct latitude , longitude ,brightness, longitude as lng, latitude as lat 
    FROM ${fire_history}
    WHERE acq_date BETWEEN '${mapdto.dateStart}' AND '${mapdto.dateEnd}'
    order by brightness`;
    return this.saveJsonAndParseAsGeoJson(query);
  }

  async getHeatSourcesByDeparment(mapdto: MapDto): Promise<MapResponse> {
    const query = `
    select a.longitude as lng, a.latitude as lat, a.brightness, a.longitude, a.latitude
    from ${fire_history} as a
    join ${departamentos.tableName} as b
    on ST_WITHIN(a.geometry, b.geom) where (a.acq_date BETWEEN '${mapdto.dateStart}' and '${mapdto.dateEnd}' 
    and b.nombre_departamento in ('${mapdto.departamento}' ));
    `;
    return this.saveJsonAndParseAsGeoJson(query);
  }

  /* async getHeatSourcesByProvincia(mapDTO: MapDto): Promise<MapResponse> {
    const query = `
    select a.longitude,a.latitude,a.longitude as lng, a.latitude as lat, a.brightness
    from fire_history as a
    join provincias as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN '${mapDTO.dateStart}'
    and '${mapDTO.dateEnd}'
    and b.nombre_provincia in ('${mapDTO.provincia}')); 
    `;
    return this.saveJsonAndParseAsGeoJson(query);
  } */
  /* async getHeatSourcesByMunicipio(mapDTO: MapDto): Promise<MapResponse> {
    const query = `
    select a.longitude,a.latitude,a.longitude as lng, a.latitude as lat, a.brightness
    from fire_history as a
    join municipios as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN '${mapDTO.dateStart}'
    and '${mapDTO.dateEnd}'
    and b.nombre_municipio in ('${mapDTO.municipio}')); 
    `;
    return this.saveJsonAndParseAsGeoJson(query);
  } */

  async getHeatSourcesByType(mapDTO: MapDto): Promise<MapResponse> {
    const { typeLocation, dateStart, dateEnd, nameLocation } = mapDTO;

    const tableMappings = {
      [TypeLocation.provincia]: {
        tableName: 'provincias',
        fieldName: 'nombre_provincia',
      },
      [TypeLocation.municipio]: {
        tableName: 'municipios',
        fieldName: 'nombre_municipio',
      },
    };

    if (!(typeLocation in tableMappings)) {
      throw new Error(
        'Debes proporcionar un tipo de consulta válido (provincia o municipio).',
      );
    }

    const { tableName, fieldName } = tableMappings[typeLocation];

    const query = `
    select a.longitude, a.latitude, a.longitude as lng, a.latitude as lat, a.brightness
    from fire_history as a
    join ${tableName} as b
    on ST_WITHIN(a.geometry, b.geom) 
    where (a.acq_date BETWEEN '${dateStart}' and '${dateEnd}'
    and ${fieldName} in ('${nameLocation}'));
  `;

    return this.saveJsonAndParseAsGeoJson(query);
  }

  async getHeatSourcesByAllType(mapDTO: MapDto) {
    let heatResources: MapResponse;
    let middlePoint: any;
    console.log(mapDTO);
    switch (mapDTO.typeLocation) {
      case TypeLocation.pais:
        heatResources = await this.getHeatSourcesByBetweenDate(mapDTO);
        middlePoint = {
          coordinates: {
            lat: -16.290154,
            lng: -63.588653,
          },
          poligono: {
            type: 'Polygon',
            coordinates: [],
          },
        };
        break;
      case TypeLocation.departamento:
        heatResources = await this.getHeatSourcesByDeparment(mapDTO);
        middlePoint = await this.getMiddlePoint(
          mapDTO.typeLocation,
          mapDTO.departamento,
        );
        break;
      case TypeLocation.provincia:
      case TypeLocation.municipio:
        heatResources = await this.getHeatSourcesByType(mapDTO);
        middlePoint = await this.getMiddlePoint(
          mapDTO.typeLocation,
          mapDTO.nameLocation,
        );
        break;
    }
    /* const middlePoint = await this.getMiddlePoint(
      mapDTO.typeLocation,
      mapDTO.nameLocation,
    ); */
    return {
      middlePoint,
      heatResources,
    };
  }

  async getDepartamentPolygon(nombre_departamento: string) {
    const query = `
        SELECT jsonb_build_object(
          'type',     'FeatureCollection',
          'features', jsonb_agg(feature)
      )
      FROM (
        SELECT jsonb_build_object(
          'type',       'Feature',
          'id',         id,
          'geometry',   ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(row) - 'gid' - 'geom'
        ) AS feature
        FROM (SELECT * FROM departamentos where nombre_departamento='${nombre_departamento}') row) features;
    `;
    const res = await this.pool.query(query);
    return res.rows[0].jsonb_build_object;
  }

  async saveNewData(path: string): Promise<boolean> {
    try {
      const query = `
        copy public.${fire_history} (latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight) FROM '${path}' CSV ENCODING 'UTF8' QUOTE '\"' ESCAPE '''';
        `;
      await this.pool.query(query);
      await this.pool.query(`
          UPDATE ${fire_history} SET geometry = ST_GeomFromText('POINT(' || longitude || ' ' || latitude || ')',4326) WHERE geometry IS null;
        `);
      console.log('subido correctamente');
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async saveJsonAndParseAsGeoJson(query: string): Promise<MapResponse> {
    try {
      const res = await this.pool.query(query);
      const geojson: MapResponse = await GeoJSON.parse(res.rows, {
        Point: ['lat', 'lng'],
      });
      const data = await createFileInfoRequest(geojson.features);

      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async getMiddlePoint(table: string, name: string) {
    const tablex = table + 's';
    const columns = {
      departamentos: 'nombre_departamento',
      municipios: 'nombre_municipio',
      provincias: 'nombre_provincia',
    };

    const column = columns[tablex];

    if (!column) {
      return '';
    }

    try {
      const centroidQuery = `
      SELECT ST_Y(centroid) AS latitude, ST_X(centroid) AS longitude
  FROM (
    SELECT ST_Centroid(ST_Union(geom)) AS centroid
    FROM ${tablex}
    WHERE ${column} = $1
  ) AS subquery
      `;

      const geojsonQuery = `
        SELECT ST_AsGeoJSON(geom)::json AS geojson
        FROM ${tablex}
        WHERE ${column} = $1
      `;

      const [centroidResult, geojsonResult] = await Promise.all([
        this.pool.query(centroidQuery, [name]),
        this.pool.query(geojsonQuery, [name]),
      ]);

      return {
        coordinates: centroidResult.rows[0],
        poligono: geojsonResult.rows[0].geojson,
      };
    } catch (error) {
      console.log(error);
      return '';
    }
  }
}
