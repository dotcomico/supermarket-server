import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file setup
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();
const getLogFile = () => path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);

// Write to file
const writeLog = (level, message, data = null) => {
  const entry = `[${getTimestamp()}] [${level}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`;
  fs.appendFileSync(getLogFile(), entry);
};

const logger = {
  info: (message, data = null) => {
    console.log(`✅ ${message}`, data || '');
    writeLog('INFO', message, data);
  },

  warn: (message, data = null) => {
    console.warn(`⚠️ ${message}`, data || '');
    writeLog('WARN', message, data);
  },

  error: (message, data = null) => {
    console.error(`❌ ${message}`, data || '');
    writeLog('ERROR', message, data);
  },
};

export default logger;
