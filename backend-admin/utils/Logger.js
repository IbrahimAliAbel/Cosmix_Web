// Simple logger untuk development dan production
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logMessage);
  }

  writeToFile(filename, message) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, message + '\n');
  }

  info(message, data = null) {
    const logMessage = this.formatMessage('INFO', message, data);
    console.log(logMessage);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('app.log', logMessage);
    }
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack
    } : null;
    
    const logMessage = this.formatMessage('ERROR', message, errorData);
    console.error(logMessage);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('error.log', logMessage);
    }
  }

  warn(message, data = null) {
    const logMessage = this.formatMessage('WARN', message, data);
    console.warn(logMessage);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('app.log', logMessage);
    }
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = this.formatMessage('DEBUG', message, data);
      console.log(logMessage);
    }
  }
}

module.exports = new Logger();