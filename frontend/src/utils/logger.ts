// Logger utility to control log verbosity in frontend
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Get log level from environment variable or default to INFO
const getLogLevel = (): number => {
  // In React Native, we can check for __DEV__ or use a custom env var
  if (__DEV__) {
    // In development, default to INFO, but can be overridden
    return LOG_LEVELS.INFO;
  }
  // In production, default to ERROR only
  return LOG_LEVELS.ERROR;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] <= getLogLevel();
};

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (shouldLog('ERROR')) {
      console.error(`❌ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog('WARN')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog('INFO')) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (shouldLog('DEBUG')) {
      console.log(`🔍 ${message}`, ...args);
    }
  },

  // Spotify-specific logging with reduced verbosity
  spotify: {
    error: (message: string, ...args: any[]) => {
      if (shouldLog('ERROR')) {
        console.error(`🎵 [ERROR] ${message}`, ...args);
      }
    },

    warn: (message: string, ...args: any[]) => {
      if (shouldLog('WARN')) {
        console.warn(`🎵 [WARN] ${message}`, ...args);
      }
    },

    info: (message: string, ...args: any[]) => {
      if (shouldLog('INFO')) {
        console.log(`🎵 [INFO] ${message}`, ...args);
      }
    },

    debug: (message: string, ...args: any[]) => {
      if (shouldLog('DEBUG')) {
        console.log(`🎵 [DEBUG] ${message}`, ...args);
      }
    },
  },
};
