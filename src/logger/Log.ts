export type Logger = {
  debug(s: string): void;
  error(s: string): void;
  throw(s: string): void;
  config: {
    debug: boolean;
  };
};

const logger: Logger = {
  debug(str) {
    if (logger.config.debug) {
      console.log(str);
    }
  },

  error(str) {
    if (logger.config.debug) {
      console.error(str);
    }
  },

  throw(str): void {
    if (logger.config.debug) {
      throw new Error(str);
    }
  },

  config: {
    debug: false,
  },
};

export default logger;
