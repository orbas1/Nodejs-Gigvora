function createLogger() {
  return {
    child: () => createLogger(),
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
  };
}

export default function pino() {
  return createLogger();
}
