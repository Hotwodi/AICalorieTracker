/**
 * Logging utility with different log levels and context
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Format log message with timestamp and context
   * @param level - Log level
   * @param message - Log message
   * @param additionalInfo - Optional additional information
   */
  private formatMessage(level: string, message: string, additionalInfo?: any): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (additionalInfo) {
      formattedMessage += ` - ${JSON.stringify(additionalInfo)}`;
    }

    return formattedMessage;
  }

  /**
   * Log informational messages
   * @param message - Message to log
   * @param additionalInfo - Optional additional information
   */
  info(message: string, additionalInfo?: any): void {
    console.log(this.formatMessage('INFO', message, additionalInfo));
  }

  /**
   * Log warning messages
   * @param message - Warning message
   * @param additionalInfo - Optional additional information
   */
  warn(message: string, additionalInfo?: any): void {
    console.warn(this.formatMessage('WARN', message, additionalInfo));
  }

  /**
   * Log error messages
   * @param message - Error message
   * @param error - Error object or additional details
   */
  error(message: string, error?: any): void {
    console.error(this.formatMessage('ERROR', message, error));
  }

  /**
   * Log debug messages (only in development)
   * @param message - Debug message
   * @param additionalInfo - Optional additional information
   */
  debug(message: string, additionalInfo?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, additionalInfo));
    }
  }
}

// Optional: Create a global logger for general use
export const globalLogger = new Logger('Global');
