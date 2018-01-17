const fs = require('fs');
const path = require('path');

import sequelize = require('sequelize');

const versionJson = require('../../../version.json'); // version information for the database

export interface UnittestConfiguration {
   databaseName: string;
   databaseUser: string;
   databasePassword: string;
   databaseHost: string;
   databasePort: number;
   databaseSqlLogger: boolean;
   databaseSqlBenchmark: boolean;
}

export class UnittestDatabase {
   public static cfg: UnittestConfiguration = {
      databaseName: process.env.TEST_DATABASE_NAME,
      databaseUser: process.env.TEST_DATABASE_USER,
      databasePassword: process.env.TEST_DATABASE_PASSWORD,
      databaseHost: process.env.TEST_DATABASE_HOST,
      databasePort: process.env.DATABASE_PORT || 5432,
      databaseSqlLogger: process.env.DATABASE_LOGGER === 'true' ? true : false,
      databaseSqlBenchmark: process.env.DATABASE_BENCHMARK === 'true' ? true : false,
   };

   public static async createDatabase(): Promise<boolean> {
      const ok = await UnittestDatabase.dropDatabase();
      if (!ok) {
         return await false;
      }

      // in the first phase might have no database - so connect to the postgres db
      let connection = await this.connect(UnittestDatabase.cfg, 'postgres');
      try {
         let sql: string = `
            CREATE DATABASE ${UnittestDatabase.cfg.databaseName}
         `;
         await UnittestDatabase.rawQuery(connection, sql);

         connection.close();

         // now reconnect to the unittest db
         connection = await this.connect(UnittestDatabase.cfg);

         sql = `
            CREATE EXTENSION "uuid-ossp"
         `;
         await UnittestDatabase.rawQuery(connection, sql);

         sql = `
            CREATE EXTENSION "pgcrypto"
         `;
         await UnittestDatabase.rawQuery(connection, sql);

         sql = `
            CREATE EXTENSION "plv8"
         `;
         await UnittestDatabase.rawQuery(connection, sql);

         sql = await UnittestDatabase.loadSqlFile('auditlog.sql', 'sql');
         await UnittestDatabase.rawQuery(connection, sql);

         sql = await UnittestDatabase.loadSqlFile('chemeasy-' + versionJson.dbversion + '.sql', 'sql');
         await UnittestDatabase.rawQuery(connection, sql);

         sql = await UnittestDatabase.loadSqlFile('chemeasy-trigger-' + versionJson.dbversion + '.sql', 'sql');
         await UnittestDatabase.rawQuery(connection, sql);

         sql = await UnittestDatabase.loadSqlFile('testdata.sql', 'testdata');
         await UnittestDatabase.rawQuery(connection, sql);

         // delete holidays
         sql = 'DELETE from HolidayTemplate';
         await UnittestDatabase.rawQuery(connection, sql);

         await connection.close();
      } catch (err) {
         console.error(err);
         await connection.close();
         return await false;
      }
      return await true;
   }

   public static async dropDatabase(): Promise<boolean> {
      const connection = await this.connect(UnittestDatabase.cfg, 'postgres');
      try {
         const sql: string = `
            DROP DATABASE IF EXISTS ${UnittestDatabase.cfg.databaseName}
         `;

         await connection.query(sql,
            {
               type: sequelize.QueryTypes.RAW
            });

         await connection.close();
      } catch (err) {
         console.error(err);
         await connection.close();
         return await false;
      }
      return await true;
   }

   private static async loadSqlFile(baseFileName: string, subPath: string): Promise<string> {
      const sqlDir = path.join(__dirname, '../../../database/' + subPath);

      const fileName = path.join(sqlDir, baseFileName);
      const result = fs.readFileSync(fileName, 'latin1'); // actually this is windows-1252

      return await result;
   }

   private static async connect(configuration: UnittestConfiguration, databaseName?: string): Promise<sequelize.Sequelize> {
      let logging: Function = <any>undefined;
      if (configuration.databaseSqlLogger != null &&
         configuration.databaseSqlLogger !== undefined &&
         configuration.databaseSqlLogger === true) {
         logging = console.log;
      }

      if (databaseName == null) {
         databaseName = configuration.databaseName;
      }

      let result = new sequelize(databaseName,
         configuration.databaseUser,
         configuration.databasePassword, {
            host: configuration.databaseHost,
            port: configuration.databasePort,
            dialect: 'postgres',
            pool: {
               max: 150,
               min: 0,
               idle: 1000
            },
            benchmark: configuration.databaseSqlBenchmark,
            logging: logging,
            define: {
               timestamps: false, // true by default - we have to disable this
            }
         });

      return result;
   }

   private static async rawQuery(connection: sequelize.Sequelize, sql: string): Promise<boolean> {
      await connection.query(sql,
         {
            type: sequelize.QueryTypes.RAW
         });
      return await true;
   }
}
