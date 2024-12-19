import * as tf from '@tensorflow/tfjs';
import { CONFIG } from '../../config.js';
import { positionManager } from './position.manager.js';
import { metricsCalculator } from './metrics.calculator.js';
import { modelService } from '../model/model.service.js';
import { bybitService } from '../bybit.service.js';
import { featureFactory } from '../features/feature.factory.js';
import { preprocessingService } from '../data/preprocessing.service.js';

class BacktestService {
    constructor() {
        this.positionManager = positionManager;
        this.metricsCalculator = metricsCalculator;
    }

    async run() {
        try {
            console.log('Loading model...');
            const modelLoaded = await modelService.loadModel();
            if (!modelLoaded) {
                throw new Error('Failed to load model');
            }

            console.log('Fetching historical data...');
            const klineData = await bybitService.getKlineData(CONFIG.DEFAULT_TIMEFRAME);
            
            console.log('Creating features...');
            let features = featureFactory.createFeatures(klineData);
            features = preprocessingService.normalizeFeatures(features);

            console.log('Running backtest...');
            await this.runBacktest(features, klineData);
            
            const results = this.metricsCalculator.calculateResults();
            this.displayResults(results);
        } catch (error) {
            console.error('Backtest failed:', error);
            throw error;
        }
    }

    async runBacktest(features, klineData) {
        for (let i = 0; i < features.length; i++) {
            const currentPrice = parseFloat(klineData[i][4]); // Close price
            
            // Update existing positions
            this.positionManager.updatePositions(currentPrice);

            // Make prediction and handle signals
            const prediction = await this.getPrediction(features[i]);
            this.handleTradingSignals(prediction, currentPrice, i);
        }
    }

    async getPrediction(features) {
        const tensor = tf.tensor2d([features], [1, features.length]);
        const prediction = modelService.model.predict(tensor);
        const result = await prediction.array();
        tensor.dispose();
        prediction.dispose();
        return result[0];
    }

    handleTradingSignals(prediction, currentPrice, timestamp) {
        const [downProb, upProb] = prediction;
        
        if (this.positionManager.canOpenPosition()) {
            if (upProb > CONFIG.TRADING.MIN_CONFIDENCE) {
                this.positionManager.openPosition('LONG', currentPrice, timestamp);
            } else if (downProb > CONFIG.TRADING.MIN_CONFIDENCE) {
                this.positionManager.openPosition('SHORT', currentPrice, timestamp);
            }
        }
    }

    displayResults(results) {
        console.log('\nBacktest Results:');
        console.log('================');
        Object.entries(results).forEach(([key, value]) => {
            if (typeof value === 'number') {
                console.log(`${key}: ${value.toFixed(2)}`);
            } else {
                console.log(`${key}: ${value}`);
            }
        });
    }
}

export const backtestService = new BacktestService();