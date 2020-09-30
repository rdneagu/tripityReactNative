class Logger {
  COLOR = {
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

  success(...args) {
    console.log(this.COLOR.GREEN, '✓   ', ...args, this.COLOR.RESET);
    return this;
  }

  warn(...args) {
    console.log(this.COLOR.BRIGHT_RED, '    ', ...args, this.COLOR.RESET);
    return this;
  }

  error(...args) {
    console.log(this.COLOR.RED, 'x   ', ...args, this.COLOR.RESET);
    return this;
  }

  info(...args) {
    console.log(this.COLOR.CYAN, '    ', ...args, this.COLOR.RESET);
    return this;
  }

  debug(...args) {
    console.log(this.COLOR.YELLOW, 'Debug     ', ...args, this.COLOR.RESET);
    return this;
  }

  print(msg, color=this.COLOR.RESET) {
    console.log(`${color}${msg}${this.COLOR.RESET}`);
    return this;
  }

  console(msg) {
    console.log(msg);
    return this;
  }

  newline() {
    console.log();
    return this;
  }
}

module.exports = new Logger();
