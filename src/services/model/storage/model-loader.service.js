import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';

class ModelLoaderService {
    async loadLatestModel() {
        const modelDir = await this.findLatestModelDir();
        if (!modelDir) {
            throw new Error('No saved model found');
        }

        try {
            // Load metadata first
            const metadata = JSON.parse(
                await fs.promises.readFile(
                    path.join(modelDir, 'metadata.json'),
                    'utf-8'
                )
            );

            // Create model from config
            const model = tf.sequential();
            const modelConfig = JSON.parse(metadata.modelConfig);
            
            // Add layers from config
            modelConfig.config.layers.forEach(layerConfig => {
                model.add(tf.layers.deserializeConfig(layerConfig));
            });

            // Compile model with same configuration
            model.compile({
                optimizer: tf.train.adam(metadata.hyperparameters.learningRate),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            console.log('Model loaded successfully');
            console.log('Model metrics:', metadata.metrics);
            console.log('Training timestamp:', metadata.timestamp);

            return { model, metadata };
        } catch (error) {
            console.error('Error loading model:', error);
            throw new Error(`Failed to load model from ${modelDir}: ${error.message}`);
        }
    }

    async findLatestModelDir() {
        const baseDir = path.join(process.cwd(), 'models');
        if (!fs.existsSync(baseDir)) {
            return null;
        }

        const dirs = await fs.promises.readdir(baseDir);
        if (dirs.length === 0) {
            return null;
        }

        // Sort directories by timestamp (newest first)
        const modelDirs = dirs
            .filter(dir => dir.startsWith('model_'))
            .sort((a, b) => {
                const timestampA = this.extractTimestamp(a);
                const timestampB = this.extractTimestamp(b);
                return timestampB.localeCompare(timestampA);
            });

        return modelDirs.length > 0 ? 
            path.join(baseDir, modelDirs[0]) : null;
    }

    extractTimestamp(dirName) {
        const match = dirName.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/);
        return match ? match[0] : '';
    }
}

export const modelLoaderService = new ModelLoaderService();