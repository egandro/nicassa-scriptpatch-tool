import sequelize = require('sequelize');

import { Database } from '../../src/database';

import { UnittestHelper } from './unittesthelper';

export interface Trigger {
   name: string;
   create: string;
   drop: string;
}

export class TriggerHelper {
   static triggers: Trigger[] = [
      {
         name: 'BusinessPrice_product_price_cache_before_trigger',
         create: `CREATE TRIGGER BusinessPrice_product_price_cache_before_trigger
         BEFORE INSERT OR UPDATE OR DELETE
         ON BusinessPrice FOR EACH ROW
         EXECUTE PROCEDURE BusinessPrice_product_price_cache_before_trigger();`,
         drop: `DROP TRIGGER IF EXISTS  BusinessPrice_product_price_cache_before_trigger ON BusinessPrice`,
      }
   ]

   public static async disableTrigger(triggerName: string): Promise<boolean> {
      const trigger: Trigger = await TriggerHelper.findTrigger(triggerName);

      await UnittestHelper.rawQuery(trigger.drop);

      return await true;
   }

   public static async enableTrigger(triggerName: string): Promise<boolean> {
      const trigger: Trigger = await TriggerHelper.findTrigger(triggerName);

      await UnittestHelper.rawQuery(trigger.drop);
      await UnittestHelper.rawQuery(trigger.create);

      return await true;
   }

   /**
    * this is slow!
    */
   public static async enableAll(): Promise<boolean> {
      for (const trigger of TriggerHelper.triggers) {
         await UnittestHelper.rawQuery(trigger.drop);
         await UnittestHelper.rawQuery(trigger.create);
      }

      return await true;
   }

   private static async findTrigger(triggerName: string): Promise<Trigger> {
      let mapTrigger: { [name: string]: Trigger; } = {};

      for (let trigger of TriggerHelper.triggers) {
         mapTrigger[trigger.name] = trigger;
      }

      let result: Trigger = null;

      switch (triggerName) {
         case 'BusinessPrice_product_price_cache_before_trigger':
            result = mapTrigger[triggerName];
            break;
         default:
            throw new Error('unknown trigger ' + triggerName);
      }

      return await result;
   }

}
