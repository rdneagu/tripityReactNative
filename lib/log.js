/* Community packages */
import { observable, action } from 'mobx';

/**
 * Class definition for the Logger lib
 * 
 * @var {Array<String>} logs       - The list of logs in desc order
 */
class Logger {
  static COLORS = {
    RESET: { unicode: '\u001b[0m', html: 'white' },
    BLACK: { unicode: '\u001b[30m', html: 'black' },
    RED: { unicode: '\u001b[31m', html: 'red' },
    GREEN: { unicode: '\u001b[32m', html: 'lime' },
    YELLOW: { unicode: '\u001b[33m', html: 'yellow' },
    BLUE: { unicode: '\u001b[34m', html: 'royalblue' },
    MAGENTA: { unicode: '\u001b[35m', html: 'magenta' },
    CYAN: { unicode: '\u001b[36m', html: '#00aaff' },
    WHITE: { unicode: '\u001b[37m', html: 'white' },
    BRIGHT_BLACK: { unicode: '\u001b[30;1m', html: 'black' },
    BRIGHT_RED: { unicode: '\u001b[31;1m', html: '#ff6347' },
    BRIGHT_GREEN: { unicode: '\u001b[32;1m', html: 'lime' },
    BRIGHT_YELLOW: { unicode: '\u001b[33;1m', html: 'yellow' },
    BRIGHT_BLUE: { unicode: '\u001b[34;1m', html: 'royalblue' },
    BRIGHT_MAGENTA: { unicode: '\u001b[35;1m', html: 'magenta' },
    BRIGHT_CYAN: { unicode: '\u001b[36;1m', html: '#00aaff' },
    BRIGHT_WHITE: { unicode: '\u001b[37;1m', html: 'white' },
  }
  @observable logs = [];

  @action.bound
  add(msg, color=Logger.COLORS.RESET.html) {
    const lastId = (this.logs.length) ? this.logs[0].id + 1 : 0;
    this.logs.unshift({ id: lastId, color, msg });
  }

  @action.bound
  clear() {
    this.logs = [];
  }

  @action.bound
  remove(logStart=this.logs.length-1, logAmount=1) {
    try {
      if (logStart < 0 || logStart >= this.logs.length) {
        throw `Logger.remove > Cannot remove ${logAmount} logs starting with index ${logStart}`;
      }
      if (logAmount < 1) {
        throw `Logger.remove > Invalid amount=${logAmount} specified!`;
      }
      this.logs.splice(logStart, logAmount);
    } catch (err) {
      this.error(err?.message || err);
    }
  }

  success(...args) {
    return this.print(args, { prefix: '✓   ', color: Logger.COLORS.GREEN });
  }

  warn(...args) {
    return this.print(args, { prefix: '    ', color: Logger.COLORS.BRIGHT_RED });
  }

  error(...args) {
    return this.print(args, { prefix: 'x   ', color: Logger.COLORS.RED });
  }

  info(...args) {
    return this.print(args, { prefix: '    ', color: Logger.COLORS.CYAN });
  }

  debug(...args) {
    return this.print(args, { prefix: '    ', color: Logger.COLORS.YELLOW });
  }

  @action.bound
  print(msgs, opts={}) {
    opts.prefix = opts.prefix || '';
    opts.color = opts.color || Logger.COLORS.RESET;
    // if (process.env['NODE_ENV'] === 'development') {
      console.log(opts.color.unicode, opts.prefix, ...msgs, Logger.COLORS.RESET.unicode);
    // }
    this.add(`${opts.prefix}${msgs.join(' ')}`, opts.color.html);
    return this;
  }

  newline() {
    // if (process.env['NODE_ENV'] === 'development') {
      console.log();
    // }
    return this;
  }
}

export default new Logger();
