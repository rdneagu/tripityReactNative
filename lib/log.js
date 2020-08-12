class TptyLog {
  static COLOR = {
    RESET: '\u001b[0m',
    BLACK: '\u001b[30m',
    RED: '\u001b[31m',
    GREEN: '\u001b[32m',
    YELLOW: '\u001b[33m',
    BLUE: '\u001b[34m',
    MAGENTA: '\u001b[35m',
    CYAN: '\u001b[36m',
    WHITE: '\u001b[37m',
    BRIGHT_BLACK: '\u001b[30;1m',
    BRIGHT_RED: '\u001b[31;1m',
    BRIGHT_GREEN: '\u001b[32;1m',
    BRIGHT_YELLOW: '\u001b[33;1m',
    BRIGHT_BLUE: '\u001b[34;1m',
    BRIGHT_MAGENTA: '\u001b[35;1m',
    BRIGHT_CYAN: '\u001b[36;1m',
    BRIGHT_WHITE: '\u001b[37;1m',
  }

  static success(...args) {
    return console.log(TptyLog.COLOR.GREEN, '✓   ', ...args, TptyLog.COLOR.RESET);
  }

  static warn(...args) {
    return console.log(TptyLog.COLOR.BRIGHT_RED, '    ', ...args, TptyLog.COLOR.RESET);
  }

  static error(...args) {
    return console.log(TptyLog.COLOR.RED, 'x   ', ...args, TptyLog.COLOR.RESET);
  }

  static info(...args) {
    return console.log(TptyLog.COLOR.CYAN, '    ', ...args, TptyLog.COLOR.RESET);
  }

  static debug(...args) {
    // if (Constants.manifest.extra.debug) {
      return console.log(TptyLog.COLOR.YELLOW, 'Debug:', ...args, TptyLog.COLOR.RESET);
    // }
  }

  static print(msg, color=TptyLog.COLOR.RESET) {
    return console.log(`${color}${msg}${TptyLog.COLOR.RESET}`);
  }

  static console(msg) {
    return console.log(msg);
  }
}

export default TptyLog;
