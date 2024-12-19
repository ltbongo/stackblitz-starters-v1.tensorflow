import { RestClientV5 } from 'bybit-api';
import { CONFIG } from '../config.js';

class BybitService {
    constructor() {
        this.client = new RestClientV5({
            key: process.env.BYBIT_API_KEY,
            secret: process.env.BYBIT_API_SECRET,
            testnet: false
        });
    }

    async getKlineData(timeframe) {
        try {
            const allKlines = [];
            let lastTimestamp = Date.now();
            
            // Fetch data in chunks until we have enough historical data
            while (allKlines.length < CONFIG.TRAINING_SAMPLES) {
                const response = await this.client.getKline({
                    category: 'spot',
                    symbol: CONFIG.TRADING_PAIR,
                    interval: timeframe,
                    limit: 1000,
                    end: lastTimestamp
                });

                const newKlines = response.result.list;
                if (newKlines.length === 0) break;

                allKlines.push(...newKlines);
                lastTimestamp = parseInt(newKlines[newKlines.length - 1][0]);
                
                // Respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Total klines fetched: ${allKlines.length}`);
            return allKlines.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error fetching kline data:', error);
            throw error;
        }
    }

    validateKlineData(klines) {
        return klines.every(candle => 
            candle.length === 7 && // Ensure all required fields are present
            !candle.some(value => isNaN(parseFloat(value))) // Ensure all values are valid numbers
        );
    }
}

export const bybitService = new BybitService();