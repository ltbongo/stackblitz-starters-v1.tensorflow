import { CONFIG } from '../../../../config.js';

class ModelSerializer {
    async serializeModel(model, metrics) {
        return {
            model: model.toJSON(),
            weights: this.serializeWeights(model.getWeights()),
            metadata: this.createMetadata(model, metrics)
        };
    }

    serializeWeights(weights) {
        return weights.map(w => ({
            data: w.arraySync(),
            shape: w.shape
        }));
    }

    createMetadata(model, metrics) {
        return {
            modelConfig: model.toJSON(),
            metrics,
            tradingPair: CONFIG.TRADING_PAIR,
            timeframe: CONFIG.DEFAULT_TIMEFRAME,
            timestamp: new Date().toISOString(),
            hyperparameters: {
                learningRate: CONFIG.LEARNING_RATE,
                batchSize: CONFIG.BATCH_SIZE,
                epochs: CONFIG.EPOCHS,
                lookbackPeriods: CONFIG.LOOKBACK_PERIODS
            }
        };
    }
}

export const modelSerializer = new ModelSerializer();