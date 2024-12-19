import { maService } from './ma.service.js';
import { rsiService } from './rsi.service.js';
import { macdService } from './macd.service.js';
import { volumeService } from './volume.service.js';
import { adxService } from './adx.service.js';
import { emaService } from './ema.service.js';
import { supertrendService } from './supertrend.service.js';
import { patternService } from './pattern.service.js';

class IndicatorFactory {
    calculateIndicators(klineData) {
        const prices = this.extractPrices(klineData);
        const volumes = this.extractVolumes(klineData);

        // Calculate base indicators
        const ma = maService.calculate(prices);
        const rsi = rsiService.calculate(prices);
        const macd = macdService.calculate(prices);
        const volume = volumeService.calculate(volumes);
        
        // Calculate advanced indicators
        const adx = adxService.calculate(klineData);
        const ema = emaService.calculate(prices);
        const supertrend = supertrendService.calculate(klineData);
        const patterns = patternService.identifyPatterns(klineData);

        return {
            ma, rsi, macd, volume,
            adx, ema, supertrend, patterns
        };
    }

    extractPrices(klineData) {
        return klineData.map(candle => parseFloat(candle[4])); // Close price
    }

    extractVolumes(klineData) {
        return klineData.map(candle => parseFloat(candle[5]));
    }
}

export const indicatorFactory = new IndicatorFactory();