import { CONFIG } from '../../config.js';
import { trailingStopService } from './trailing-stop.service.js';
import { tradeRecorder } from './trade.recorder.js';

class PositionManager {
    constructor() {
        this.positions = [];
        this.balance = CONFIG.TRADING.POSITION_SIZE;
    }

    canOpenPosition() {
        return this.positions.length < CONFIG.TRADING.MAX_POSITIONS;
    }

    openPosition(direction, price, timestamp) {
        const position = {
            direction,
            entryPrice: price,
            quantity: CONFIG.TRADING.POSITION_SIZE / price,
            stopLoss: this.calculateStopLoss(direction, price),
            takeProfit: this.calculateTakeProfit(direction, price),
            timestamp,
            trailingStop: null
        };

        this.positions.push(position);
        console.log(`Opened ${direction} position at ${price}`);
    }

    updatePositions(currentPrice) {
        for (let i = this.positions.length - 1; i >= 0; i--) {
            const position = this.positions[i];
            const pnl = this.calculatePnL(position, currentPrice);

            if (CONFIG.TRADING.TRAILING_STOP.ENABLED) {
                trailingStopService.updateTrailingStop(position, currentPrice, pnl);
            }

            if (this.shouldClosePosition(position, currentPrice)) {
                this.closePosition(i, currentPrice);
            }
        }
    }

    calculateStopLoss(direction, price) {
        return direction === 'LONG' ?
            price * (1 - CONFIG.TRADING.STOP_LOSS_PERCENTAGE / 100) :
            price * (1 + CONFIG.TRADING.STOP_LOSS_PERCENTAGE / 100);
    }

    calculateTakeProfit(direction, price) {
        return direction === 'LONG' ?
            price * (1 + CONFIG.TRADING.TAKE_PROFIT_PERCENTAGE / 100) :
            price * (1 - CONFIG.TRADING.TAKE_PROFIT_PERCENTAGE / 100);
    }

    calculatePnL(position, currentPrice) {
        const { direction, entryPrice, quantity } = position;
        return direction === 'LONG' ?
            (currentPrice - entryPrice) * quantity :
            (entryPrice - currentPrice) * quantity;
    }

    shouldClosePosition(position, currentPrice) {
        const { direction, stopLoss, takeProfit, trailingStop } = position;
        
        if (direction === 'LONG') {
            if (currentPrice <= stopLoss) return true;
            if (currentPrice >= takeProfit) return true;
            if (trailingStop && currentPrice <= trailingStop) return true;
        } else {
            if (currentPrice >= stopLoss) return true;
            if (currentPrice <= takeProfit) return true;
            if (trailingStop && currentPrice >= trailingStop) return true;
        }
        
        return false;
    }

    closePosition(index, currentPrice) {
        const position = this.positions[index];
        const pnl = this.calculatePnL(position, currentPrice);
        const fees = this.calculateFees(position, currentPrice);
        const netPnl = pnl - fees;
        
        this.balance += netPnl;
        tradeRecorder.recordTrade({
            ...position,
            exitPrice: currentPrice,
            pnl: netPnl,
            fees
        });
        
        this.positions.splice(index, 1);
        console.log(`Closed ${position.direction} position at ${currentPrice}. PnL: ${netPnl.toFixed(2)} USDT`);
    }

    calculateFees(position, currentPrice) {
        return (currentPrice * position.quantity) * (CONFIG.TRADING.COMMISSION_RATE / 100);
    }

    getBalance() {
        return this.balance;
    }

    reset() {
        this.positions = [];
        this.balance = CONFIG.TRADING.POSITION_SIZE;
    }
}

export const positionManager = new PositionManager();