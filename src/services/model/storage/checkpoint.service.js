import * as tf from '@tensorflow/tfjs';
import { ModelCheckpoint } from './types/model-checkpoint.js';
import { CONFIG } from '../../../config.js';

class CheckpointService {
    constructor() {
        this.bestMetrics = {
            accuracy: 0,
            loss: Infinity,
            epoch: 0
        };
        this.latestCheckpoint = null;
    }

    shouldSaveCheckpoint(metrics) {
        return (
            metrics.accuracy > this.bestMetrics.accuracy ||
            (metrics.loss < this.bestMetrics.loss * 0.95)
        );
    }

    async saveCheckpoint(model, metrics) {
        try {
            const modelId = this.generateModelId();
            const checkpoint = ModelCheckpoint.fromModel(modelId, model, metrics);
            
            this.latestCheckpoint = checkpoint;
            this.updateBestMetrics(metrics);
            
            this.logCheckpointSaved(checkpoint);
            return true;
        } catch (error) {
            console.error('Error saving checkpoint:', error);
            throw error;
        }
    }

    async loadLatestCheckpoint() {
        if (!this.latestCheckpoint) {
            throw new Error('No saved checkpoint found');
        }

        const model = tf.sequential();
        model.fromConfig(this.latestCheckpoint.metadata.modelConfig);

        const weights = this.latestCheckpoint.weights.map(w => 
            tf.tensor(w.data, w.shape, 'float32')
        );
        model.setWeights(weights);

        return model;
    }

    generateModelId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `model_${CONFIG.TRADING_PAIR}_${CONFIG.DEFAULT_TIMEFRAME}_${timestamp}`;
    }

    updateBestMetrics(metrics) {
        this.bestMetrics = {
            accuracy: metrics.accuracy,
            loss: metrics.loss,
            epoch: metrics.epoch
        };
    }

    logCheckpointSaved(checkpoint) {
        console.log(`\nCheckpoint saved at epoch ${checkpoint.metadata.epoch}:`);
        console.log(`- Model ID: ${checkpoint.modelId}`);
        console.log(`- Validation accuracy: ${checkpoint.metadata.accuracy.toFixed(4)}`);
        console.log(`- Validation loss: ${checkpoint.metadata.loss.toFixed(4)}`);
    }
}

export const checkpointService = new CheckpointService();