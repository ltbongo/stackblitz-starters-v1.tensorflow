import * as tf from '@tensorflow/tfjs';
import { CONFIG } from '../../config.js';
import { LayersService } from './layers.service.js';
import { trainingService } from './training.service.js';
import { validateFeatures, validateLabels } from '../../utils/validation.js';
import { createTensor, disposeTensors } from '../../utils/tensor.js';
import { modelLoaderService } from './storage/model-loader.service.js';

class ModelService {
    constructor() {
        this.model = null;
        this.metadata = null;
        
        // Calculate total features per period
        this.featuresPerPeriod = 
            4 + // Base features (MA, RSI, MACD, Volume)
            2 + // ADX and Supertrend
            CONFIG.TECHNICAL_INDICATORS.EMA.periods.length + // EMA features
            1;  // Pattern momentum
        
        // Total input shape is features per period * lookback periods
        this.inputShape = this.featuresPerPeriod * CONFIG.LOOKBACK_PERIODS;
        console.log(`Model input shape: ${this.inputShape} (${this.featuresPerPeriod} features × ${CONFIG.LOOKBACK_PERIODS} periods)`);
    }

    createModel() {
        const model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.dense({
            units: 256,
            inputShape: [this.inputShape],
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.activation({ activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: 0.3 }));

        // Hidden layers
        model.add(tf.layers.dense({
            units: 128,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.activation({ activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: 0.3 }));

        model.add(tf.layers.dense({
            units: 64,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.activation({ activation: 'relu' }));
        model.add(tf.layers.dropout({ rate: 0.2 }));

        // Output layer
        model.add(tf.layers.dense({
            units: 2,
            activation: 'softmax',
            kernelInitializer: 'glorotNormal'
        }));

        const optimizer = tf.train.adam(CONFIG.LEARNING_RATE);
        
        model.compile({
            optimizer,
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        this.model = model;
        return model;
    }

    async loadModel() {
        try {
            const { model, metadata } = await modelLoaderService.loadLatestModel();
            this.model = model;
            this.metadata = metadata;
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            return false;
        }
    }

    async train(features, labels) {
        // Validate input shapes
        validateFeatures(features, this.inputShape);
        validateLabels(labels);

        if (!this.model) {
            this.createModel();
        }

        // Create tensors with explicit shapes
        const xs = createTensor(features, [features.length, this.inputShape]);
        const ys = createTensor(labels, [labels.length, 2]);

        try {
            console.log('Training shapes:', {
                features: xs.shape,
                labels: ys.shape
            });

            return await trainingService.trainModel(this.model, xs, ys);
        } finally {
            disposeTensors(xs, ys);
        }
    }

    predict(features) {
        validateFeatures(features, this.inputShape);
        
        if (!this.model) {
            throw new Error('Model not trained');
        }

        const xs = createTensor(features, [features.length, this.inputShape]);
        
        try {
            return this.model.predict(xs);
        } finally {
            disposeTensors(xs);
        }
    }
}

export const modelService = new ModelService();