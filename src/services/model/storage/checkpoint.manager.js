import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../../config.js';

class CheckpointManager {
    constructor() {
        this.baseDir = path.join(process.cwd(), 'models');
        this.currentSession = new Date().toISOString().replace(/[:.]/g, '-');
        this.bestCheckpoint = null;
    }

    getBestMetrics() {
        return this.bestCheckpoint?.metrics || {
            accuracy: 0,
            loss: Infinity,
            epoch: 0
        };
    }

    isBetterCheckpoint(metrics) {
        const bestMetrics = this.getBestMetrics();
        
        // Primary condition: Better accuracy
        if (metrics.accuracy > bestMetrics.accuracy) {
            return true;
        }
        
        // Secondary condition: Same accuracy but significantly better loss
        if (metrics.accuracy === bestMetrics.accuracy && 
            metrics.loss < bestMetrics.loss * 0.95) {
            return true;
        }
        
        return false;
    }

    async saveCheckpoint(modelData) {
        const checkpointDir = this.getCheckpointDir();
        
        // Remove previous checkpoint if it exists
        if (this.bestCheckpoint) {
            await this.removeCheckpoint(this.bestCheckpoint.dir);
        }

        // Save new checkpoint
        await this.writeCheckpoint(checkpointDir, modelData);
        
        // Update best checkpoint reference
        this.bestCheckpoint = {
            dir: checkpointDir,
            metrics: modelData.metrics
        };

        return checkpointDir;
    }

    getCheckpointDir() {
        return path.join(
            this.baseDir,
            `model_${CONFIG.TRADING_PAIR}_${CONFIG.DEFAULT_TIMEFRAME}_${this.currentSession}`
        );
    }

    async removeCheckpoint(dir) {
        if (fs.existsSync(dir)) {
            const files = await fs.promises.readdir(dir);
            await Promise.all(
                files.map(file => fs.promises.unlink(path.join(dir, file)))
            );
            await fs.promises.rmdir(dir);
        }
    }

    async writeCheckpoint(dir, modelData) {
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        await Promise.all([
            fs.promises.writeFile(
                path.join(dir, 'metadata.json'),
                JSON.stringify(modelData.metadata, null, 2)
            ),
            fs.promises.writeFile(
                path.join(dir, 'weights.json'),
                JSON.stringify(modelData.weights, null, 2)
            ),
            fs.promises.writeFile(
                path.join(dir, 'model.json'),
                JSON.stringify(modelData.model, null, 2)
            )
        ]);
    }
}

export const checkpointManager = new CheckpointManager();