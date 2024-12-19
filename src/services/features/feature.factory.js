import { CONFIG } from '../../config.js';
import { indicatorFactory } from '../indicators/indicator.factory.js';

class FeatureFactory {
    createFeatures(klineData) {
        console.log('Creating features...');
        
        // Calculate all indicators
        const indicators = indicatorFactory.calculateIndicators(klineData);
        
        // Find valid start index where all indicators have values
        const validStartIndex = this.findValidStartIndex(indicators);
        
        // Create feature arrays
        const features = [];
        // Adjust end index to leave room for future price prediction
        const endIndex = klineData.length - 1;

        for (let i = validStartIndex; i < endIndex; i++) {
            // Only look back if we have enough data
            if (i >= CONFIG.LOOKBACK_PERIODS - 1) {
                const featureWindow = this.createFeatureWindow(indicators, i);
                
                // Only add valid feature windows
                if (this.isValidFeatureWindow(featureWindow)) {
                    features.push(featureWindow);
                }
            }
        }

        console.log(`Created ${features.length} feature samples`);
        console.log(`Each sample has ${features[0]?.length || 0} features`);

        return features;
    }

    findValidStartIndex(indicators) {
        const startIndices = [
            indicators.ma.findIndex(val => !isNaN(val)),
            indicators.rsi.findIndex(val => !isNaN(val)),
            indicators.macd.findIndex(val => !isNaN(val)),
            indicators.volume.findIndex(val => !isNaN(val)),
            indicators.adx.findIndex(val => !isNaN(val)),
            ...indicators.ema.map(ema => ema.findIndex(val => !isNaN(val)))
        ];

        // Filter out -1 values and find the maximum start index
        return Math.max(...startIndices.filter(idx => idx !== -1));
    }

    createFeatureWindow(indicators, currentIndex) {
        const featureWindow = [];
        
        // For each period in the lookback window
        for (let j = CONFIG.LOOKBACK_PERIODS - 1; j >= 0; j--) {
            const idx = currentIndex - j;
            
            // Base technical indicators
            featureWindow.push(
                this.getIndicatorValue(indicators.ma, idx),
                this.getIndicatorValue(indicators.rsi, idx),
                this.getIndicatorValue(indicators.macd, idx),
                this.getIndicatorValue(indicators.volume, idx)
            );

            // Advanced indicators
            featureWindow.push(
                this.getIndicatorValue(indicators.adx, idx),
                indicators.supertrend[idx]?.trend || 0
            );

            // EMAs
            indicators.ema.forEach(ema => {
                featureWindow.push(this.getIndicatorValue(ema, idx));
            });

            // Pattern features
            featureWindow.push(
                indicators.patterns[idx]?.momentum || 0
            );
        }

        return featureWindow;
    }

    getIndicatorValue(indicator, index) {
        const value = indicator[index];
        return value !== undefined && !isNaN(value) ? value : 0;
    }

    isValidFeatureWindow(featureWindow) {
        return featureWindow.length > 0 && !featureWindow.some(val => 
            val === undefined || 
            val === null || 
            isNaN(val)
        );
    }
}

export const featureFactory = new FeatureFactory();