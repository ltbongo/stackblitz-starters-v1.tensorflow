import { CONFIG } from '../../../config.js';

class EarlyStoppingService {
    constructor() {
        this.bestValLoss = Infinity;
        this.patienceCounter = 0;
    }

    check(valLoss) {
        if (valLoss < this.bestValLoss - CONFIG.EARLY_STOPPING.minDelta) {
            this.bestValLoss = valLoss;
            this.patienceCounter = 0;
            return { shouldStop: false, isImprovement: true };
        }

        this.patienceCounter++;
        const shouldStop = this.patienceCounter >= CONFIG.EARLY_STOPPING.patience;
        return { shouldStop, isImprovement: false };
    }

    reset() {
        this.bestValLoss = Infinity;
        this.patienceCounter = 0;
    }
}

export const earlyStoppingService = new EarlyStoppingService();