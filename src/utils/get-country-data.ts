import * as cheerio from 'cheerio';
import * as rp from 'request-promise';

import { CountryReference } from 'funktologies';

import { consts } from '../constants/constants';
import { store } from '../constants/globalStore';
import { dataScrapers } from '../scrapers/data-getters';
import { countryToId } from './country-to-id';

export function getCountryData(country: CountryReference, url: string): any {
    if (country && url) {
        return rp(url, { timeout: consts.BASE.DATA_REQUEST_TIMEOUT })
            .then((html) => {
                const $ = cheerio.load(html);
                const countryId = countryToId(country.dataCode);
                dataScrapers.getLeaders($, country.name, countryId);
                store.debugLogger(` World Leader data scrape for ${country.name} is complete`);
            })
            .catch((err: Response) => {
                let errMsg;
                if (err && err['statusCode'] === 404) {
                    store.countriesNotFound.push(country.name);
                    errMsg = `${
                        new Date().toISOString()
                    }\n\nIndividual country query failed:  ${
                    country.name}\n${url}\nNot Found (404)\n\n`;
                } else {
                    store.failedCountries.push(country);
                    errMsg = `${
                        new Date().toISOString()
                    }\n\nIndividual country query failed:  ${
                    country.name}\n${url}\n${err.toString().trim()}\n\n`;
                }
                store.errorLogger(errMsg);
            });
    } else {
        return new Promise(resolve => {
            store.errorLogger(`${
                new Date().toISOString()}\n\nFailure to scrape data for ${
                country.name} at \n${url}\n\n`);
            resolve();
        }).then(() => { /* not empty */ });
    }
};