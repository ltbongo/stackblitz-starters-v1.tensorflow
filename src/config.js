export const CONFIG = {
    // Trading pair configuration
    TRADING_PAIR: 'BTCUSDT',
    TIMEFRAMES: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D', 'W', 'M'],
    DEFAULT_TIMEFRAME: '1',
    
    // Data configuration
    TRAINING_SAMPLES: 9000,
    LOOKBACK_PERIODS: 3,
    
    // Technical indicators configuration
    TECHNICAL_INDICATORS: {
        MA: {
            period: 200
        },
        EMA: {
            periods: [9, 21, 50]
        },
        RSI: {
            period: 14
        },
        MACD: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9
        },
        ADX: {
            period: 14
        },
        SUPERTREND: {
            period: 10,
            multiplier: 3
        },
        SUPPORT_RESISTANCE: {
            lookback: 100,
            threshold: 0.02
        }
    },
    
    // Model configuration
    BATCH_SIZE: 32,
    EPOCHS: 150,
    VALIDATION_SPLIT: 0.2,
    LEARNING_RATE: 0.001,
    EARLY_STOPPING: {
        patience: 10,
        minDelta: 0.001
    },
    
    // Trading configuration
    TRADING: {
        POSITION_SIZE: 1000,           // Size of each position in USDT
        MAX_POSITIONS: 1,              // Maximum number of concurrent positions
        STOP_LOSS_PERCENTAGE: 2.0,     // Stop loss percentage
        TAKE_PROFIT_PERCENTAGE: 4.0,   // Take profit percentage
        TRAILING_STOP: {
            ENABLED: true,
            ACTIVATION_PERCENTAGE: 1.0, // Profit percentage to activate trailing stop
            TRAILING_PERCENTAGE: 0.5    // Distance to maintain for trailing stop
        },
        COMMISSION_RATE: 0.1,          // Trading fee percentage
        MIN_CONFIDENCE: 0.65,          // Minimum prediction confidence to enter trade
        MAX_DRAWDOWN: 15,              // Maximum drawdown percentage allowed
        RISK_PER_TRADE: 1.0,          // Percentage of account to risk per trade
    },

    // Feature weights
    FEATURE_WEIGHTS: {
        Pattern: 3.0,     // Increase due to highest importance
        EMA: 1.5,         // Increase due to positive impact
        RSI: 0,           // Reduce from current
        MACD: 0,          // Reduce due to low impact
        Volume: 0,        // Keep as is
        ADX: 0,           // Reduce due to minimal impact
        Supertrend: 0,    // Keep as is
        MA: 2.0           // Keep moderate despite negative correlation
    }
};