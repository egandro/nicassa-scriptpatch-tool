import sequelize = require('sequelize');

import { iocContainer } from '../../src/lib/ioc/ioc';
import { ShaUtil } from '../shared/crypto/shautil';

import { Database } from '../../src/database';

import { createJWTData } from '../../src/authentication';
import { JwtData } from '../../src/contract/security/jwt.data';
import { getTokenFromString } from '../../src/authentication';

import { DatabaseHelper } from '../shared/database/databasehelper';
import { ColorTools } from '../shared/color/colortools';

import { LookupService } from '../../src/service/lookup.service';
import { AccountService } from '../../src/service/account.service';
import { SecurityService } from '../../src/service/security.service';;
import { CustomerService } from '../../src/service/customer.service';
import { SupplierService } from '../../src/service/supplier.service';
import { CorporationService } from '../../src/service/corporation.service';
import { UserTermService } from '../../src/service/userterm.service';

import { CorporationRepository } from '../../src/dal/corporation.repository';
import { DebugRepository } from '../../src/dal/debug.repository';

import {
   Site, Paymentterm, Deliveryoption
} from '../../src/dal/model/entities';

import { TsoaBug1, TsoaBug2 } from '../../src/contract/data/tsoabug.dto';

import { DeliveryoptionDTO } from '../../src/contract/data/deliveryoption.dto';
import { BusinesspriceDTO } from '../../src/contract/data/businessprice.dto';
import { VCorporationAccountDTO } from '../../src/contract/data/vcorporationaccount.dto';
import { CredentialsDTO } from '../../src/contract/data/credentials.dto';
import { CorporationDTO } from '../../src/contract/data/corporation.dto';
import { ProductDTO, ProductPaymentTermDTO } from '../../src/contract/data/product.dto';

import { TestDataAccount } from '../testdata';

export class UnittestHelper {
   static DefaultPassword: string = 'secret';

   public static async login(account: string): Promise<JwtData> {
      let login: string;
      let password: string;

      switch (account) {
         case 'admin':
            login = TestDataAccount.ACCOUNT_ADMIN_NAME;
            password = TestDataAccount.ACCOUNT_ADMIN_PASSWORD;
            break;
         case 'customer':
            login = TestDataAccount.ACCOUNT_CUSTOMER_NAME;
            password = TestDataAccount.ACCOUNT_CUSTOMER_PASSWORD;
            break;
         case 'supplier':
            login = TestDataAccount.ACCOUNT_SUPPLIER_NAME;
            password = TestDataAccount.ACCOUNT_SUPPLIER_PASSWORD;
            break;
         case 'supplier2':
            login = TestDataAccount.ACCOUNT_SUPPLIER2_NAME;
            password = TestDataAccount.ACCOUNT_SUPPLIER2_PASSWORD;
            break;
         default:
            throw new Error('unknown account ' + account)
      }

      const securityService = iocContainer.get<SecurityService>(SecurityService);
      const credentials: CredentialsDTO = {
         login: login,
         passwordHash: ShaUtil.checkSum(password)
      }

      const profile = await securityService.login(credentials);
      const result = await getTokenFromString(profile.jwt);

      return await result;
   }

   public static async loginForGeneratedUser(accountId: string): Promise<JwtData> {
      const debugRepository = iocContainer.get<DebugRepository>(DebugRepository);

      let login: string = await debugRepository.getLoginForAccountId(accountId);
      let password: string = UnittestHelper.DefaultPassword;

      const securityService = iocContainer.get<SecurityService>(SecurityService);
      const credentials: CredentialsDTO = {
         login: login,
         passwordHash: ShaUtil.checkSum(password)
      }

      const profile = await securityService.login(credentials);
      const result = await getTokenFromString(profile.jwt);

      return await result;
   }

   public static async createCorporation(adminAccountId: string, corporationName: string): Promise<CorporationDTO> {
      const jwtAdmin = UnittestHelper.getDebugJWT(adminAccountId, 'admin', true);

      const corporation: CorporationDTO = {
         corporationid: DatabaseHelper.uuid(),
         name: corporationName,
         shortname: corporationName.replace(/#|_|&|@|\s+/g, '').substring(0, 10),
         country: 'Germany',
         taxnr: '1234567',
         enabled: true,
         color: this.getRandomColor(),
         visible: true
      };

      const corporationService = iocContainer.get<CorporationService>(CorporationService);
      await corporationService.saveCorporation(jwtAdmin, corporation, false);

      return await corporation;
   }

   public static async createSite(adminAccountId: string, corporationId: string, siteBaseName: string, timezone: string): Promise<string> {
      const jwtAdmin = UnittestHelper.getDebugJWT(adminAccountId, 'admin', true);

      // this will also create the workdays
      const site: Site = {
         siteid: DatabaseHelper.uuid(),
         corporationid: corporationId,
         name: siteBaseName,
         shortname: siteBaseName.substring(0, 3).toUpperCase(),
         timezone: timezone,
         enabled: true
      }

      const corporationService = iocContainer.get<CorporationService>(CorporationService);
      const siteId = await corporationService.saveSite(jwtAdmin, site);

      return await siteId;
   }

   public static async createAccount(adminAccountId: string, corporationId: string, corporationName: string,
      accountType: string, dontAcceptUserTerms?: boolean): Promise<string> {
      const jwtAdmin = UnittestHelper.getDebugJWT(adminAccountId, 'admin', true);

      const passwordHash = ShaUtil.checkSum(UnittestHelper.DefaultPassword);
      let email = corporationName.replace(/[^A-Za-z0-9]/g, '');
      email = email + '-' + accountType + '@example.com';
      email = email.toLowerCase();

      const user: VCorporationAccountDTO = {
         name: 'Slave of ' + corporationName,
         firstname: 'Dummy ' + accountType,
         corporationid: corporationId,
         enabled: true,
         email: email,
         passwordHash: passwordHash,
         accountid: DatabaseHelper.uuid(),
         roles: [accountType],
         corporation: '',
         country: '',
         corporationvisible: true,
      };


      const accountService = iocContainer.get<AccountService>(AccountService);
      const result = await accountService.saveAccount(jwtAdmin, user, false);

      if (dontAcceptUserTerms == null ||
         dontAcceptUserTerms === undefined ||
         dontAcceptUserTerms === false) {
         // also accept the userterms
         const userTermService = iocContainer.get<UserTermService>(UserTermService);
         // current userterms
         const userTerm = await userTermService.loadActiveUserTerm(jwtAdmin);

         // login as user
         const jwtUser = UnittestHelper.getDebugJWT(result, accountType, true);
         const securityService = iocContainer.get<SecurityService>(SecurityService);

         // accept the terms
         await securityService.acceptUserTerm(jwtUser, userTerm.usertermid);
      }

      return await result;
   }

   public static async createSiteProduct(supplierAccountId: string, siteId: string, productName: string,
      commodityId: string, paymentTerms: Paymentterm[], activateCommodityForSupplierIfNeeded?: boolean,
      corporationid?: string, factors?: number[], averagequantity?: number): Promise<ProductDTO> {

      if (activateCommodityForSupplierIfNeeded) {
         if (!corporationid) {
            throw new Error('corporationid is required with parameter activateCommodityForSupplierIfNeeded')
         }
         await UnittestHelper.activateCommodityForSupplierIfNeeded(corporationid, commodityId);
      }

      const productPaymentTerm: ProductPaymentTermDTO[] = [];

      if(factors) {
         if(factors.length !== paymentTerms.length) {
            throw new Error('lengths of the factores does not match the length of the paymentterms');
         }
      } else {
         factors = [];
         let factor = 1.0;
         for (const item of paymentTerms) {
            factors.push(factor);
            factor += 0.1;
         }
      }

      if(averagequantity == null || averagequantity === undefined) {
         averagequantity = 10;
      }

      // create paymentterms for this product
      let index = 0;
      for (const item of paymentTerms) {
         const factor = factors[index];
         index++;
         const data: ProductPaymentTermDTO = {
            productpaymenttermId: DatabaseHelper.uuid(),
            paymenttermId: item.paymenttermid,
            factor: factor
         }
         productPaymentTerm.push(data);
      }

      const product: ProductDTO = {
         siteId: siteId,
         productId: DatabaseHelper.uuid(),
         product: productName,
         averagequantity: averagequantity,
         commodityId: commodityId,
         property1: 'Property Data 1',
         property2: 'Property Data 2',
         property3: 'Property Data 3',
         paymentTerms: productPaymentTerm,
         enabled: true
      }

      // impersonate as supplier
      const jwtSupplier = UnittestHelper.getDebugJWT(supplierAccountId, 'supplier');

      const supplierService = iocContainer.get<SupplierService>(SupplierService);
      await supplierService.saveProduct(jwtSupplier, product);

      return await product;
   }

   public static async createOrUpdatePrices(supplierAccountId: string, prices: BusinesspriceDTO[]): Promise<boolean> {
      // impersonate as supplier
      const jwtSupplier = UnittestHelper.getDebugJWT(supplierAccountId, 'supplier');

      const tsoaBug1: TsoaBug1 = { prices: prices }

      const supplierService = iocContainer.get<SupplierService>(SupplierService);
      await supplierService.saveBusinesspriceList(jwtSupplier, tsoaBug1);

      return await true;
   }

   public static async getPaymentTerms(): Promise<Paymentterm[]> {
      const jwtAdmin = await UnittestHelper.login('admin');

      const lookupService = iocContainer.get<LookupService>(LookupService);
      const result = await lookupService.getPaymentTerms(jwtAdmin);

      return await result;
   }

   public static async activateCommodityForSupplierIfNeeded(corporationId: string, commodityId: string): Promise<boolean> {
      const debugRepository = iocContainer.get<DebugRepository>(DebugRepository);
      await debugRepository.activateCommodityForSupplierIfNeeded(corporationId, commodityId);

      return await true;
   }

   public static async activateCommodityForCustomerIfNeeded(corporationId: string, commodityId: string): Promise<boolean> {
      const debugRepository = iocContainer.get<DebugRepository>(DebugRepository);
      await debugRepository.activateCommodityForCustomerIfNeeded(corporationId, commodityId);

      return await true;
   }

   public static async deleteProduct(productId: string): Promise<boolean> {
      const sql: string = `
         DELETE FROM Product WHERE productid = :productid
      `;

      const data: any = await UnittestHelper.rawQuery(sql, { productid: productId });

      return await true;
   }

   public static async dropAllBusinessPrices(): Promise<boolean> {
      const sql: string = `
         DELETE FROM BusinessPrice
      `;

      const data: any = await UnittestHelper.rawQuery(sql);

      return await true;
   }

   public static async dropAllDeliveryOptions(): Promise<boolean> {
      const sql: string = `
         DELETE FROM DeliveryOption
      `;

      const data: any = await UnittestHelper.rawQuery(sql);

      return await true;
   }

   public static async dropAllProducts(): Promise<boolean> {
      const sql: string = `
         DELETE FROM Product
      `;

      const data: any = await UnittestHelper.rawQuery(sql);

      return await true;
   }

   public static async selectQuery(sql: string, replacements?: Object | string[]): Promise<any> {
      const result = UnittestHelper.databaseQuery(sequelize.QueryTypes.SELECT, sql, replacements);
      return await result;
   }

   public static async rawQuery(sql: string, replacements?: Object | string[]): Promise<any> {
      const result = UnittestHelper.databaseQuery(sequelize.QueryTypes.RAW, sql, replacements);
      return await result;
   }

   public static rndLongString(): string {
      const result = UnittestHelper.randomString(255);
      return result;
   }

   public static rndShortString(): string {
      const result = UnittestHelper.randomString(64);
      return result;
   }

   public static rndNumber(max: number): number {
      const result = Math.floor(Math.random() * max);
      return result;
   }

   public static async createOrUpdateDeliveryOption(supplierAccountId: string, customerAccountId: string, destinationSiteId: string,
      productId: string, freightrate: number, leadtime: number, fca?: boolean): Promise<Deliveryoption> {

      const supplierService = iocContainer.get<SupplierService>(SupplierService);
      const debugRepository = iocContainer.get<DebugRepository>(DebugRepository);
      let deliveryoption = await debugRepository.findDeliveryOption(destinationSiteId, productId);

      if (deliveryoption == null) {
         // request activation for the product as customer
         // impersonate as customer
         const jwtCustomer = UnittestHelper.getDebugJWT(customerAccountId, 'customer');
         // simulate what the customer is doing

         const customerService = iocContainer.get<CustomerService>(CustomerService);
         await customerService.requestProduct(jwtCustomer, destinationSiteId, productId);
         // load this option after creation
         deliveryoption = await debugRepository.findDeliveryOption(destinationSiteId, productId);
      }

      // impersonate as supplier
      const jwtSupplier = UnittestHelper.getDebugJWT(supplierAccountId, 'supplier');

      if (deliveryoption.deliveryenableddateutc == null ||
         deliveryoption.deliveryenableddateutc === undefined ||
         deliveryoption.deliveryenableddateutc === <any>'null') { // whatever...
         // request activation for the product as customer
         // simulate what the supplier is doing
         await supplierService.enableDeliveryOption(jwtSupplier, deliveryoption.deliveryoptionid, deliveryoption.productid);
         // load this option after creation
         deliveryoption = await debugRepository.findDeliveryOption(destinationSiteId, productId);
      }

      const tsoaBug2: TsoaBug2 = { deliveryoptionDtos: [] }
      let isFCA = false;
      if (fca !== null && fca !== undefined) {
         isFCA = fca;
      }

      const deliveryoptionDto: DeliveryoptionDTO = {
         deliveryoptionid: deliveryoption.deliveryoptionid,
         freightrate: freightrate,
         leadtime: leadtime,
         isFCA: isFCA
      }
      tsoaBug2.deliveryoptionDtos.push(deliveryoptionDto);

      // apply the new parameters
      // simulate what the supplier is doing
      await supplierService.updateDeliveryOptions(jwtSupplier, tsoaBug2);

      // reload it
      deliveryoption = await debugRepository.findDeliveryOption(destinationSiteId, productId);

      return await deliveryoption;
   }

   public static async updateLeadTime(supplierAccountId: string, deliveryOptionId: string, leadtime: number): Promise<Deliveryoption> {
      const supplierService = iocContainer.get<SupplierService>(SupplierService);
      const debugRepository = iocContainer.get<DebugRepository>(DebugRepository);

      const deliveryoption = await debugRepository.findDeliveryOptionById(deliveryOptionId);
      deliveryoption.leadtime = leadtime;

      const deliveryoptionDTO: DeliveryoptionDTO = {
         deliveryoptionid: deliveryoption.deliveryoptionid,
         freightrate: deliveryoption.freightrate,
         leadtime: deliveryoption.leadtime,
         isFCA: deliveryoption.isfca
      }

      const tsoaBug2: TsoaBug2 = { deliveryoptionDtos: [] }
      tsoaBug2.deliveryoptionDtos.push(deliveryoptionDTO);

      // impersonate as supplier
      const jwtSupplier = UnittestHelper.getDebugJWT(supplierAccountId, 'supplier');

      await supplierService.updateDeliveryOptions(jwtSupplier, tsoaBug2);

      return await deliveryoption;
   }

   private static getDebugJWT(accountId: string, type: string, isAdmin?: boolean): JwtData {
      const scopes: string[] = [];
      scopes.push(type);
      scopes.push('debug');

      if (isAdmin == null || isAdmin == undefined) {
         isAdmin = false;
      }

      const result = createJWTData(accountId, isAdmin, true, scopes);
      return result;
   }

   private static getRandomColor(): number {
      // https://stackoverflow.com/questions/1484506/random-color-generator
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
         color += letters[Math.floor(Math.random() * 16)];
      }
      return ColorTools.HEXToColorNumber(color);
   }

   private static randomString(count: number) {
      // https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
      let result = '';
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < count; i++) {
         result += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return result;
   }

   private static async databaseQuery(type: string, sql: string, replacements?: Object | string[]): Promise<any> {
      const result = await Database.con.connection.query(sql,
         {
            replacements: replacements,
            type: type
         });
      return await result;
   }
}
