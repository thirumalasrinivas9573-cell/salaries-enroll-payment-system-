const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BIN_PATH = path.resolve(__dirname, '../../../cpp_engine/bin/payroll_engine');

/**
 * Executes the compiled C++17 OOP calculation engine via JSON-IPC.
 * @param {Object} payload { month, year, pfCeiling, esicCeiling, restrictPfCeiling, items: [...] }
 * @returns {Promise<Object>} Processed payroll results, slips, and export strings.
 */
function runCppEngine(payload) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BIN_PATH)) {
      return reject(new Error(`C++ Engine binary not found at: ${BIN_PATH}. Please compile with 'make' in cpp_engine/ directory.`));
    }

    const child = spawn(BIN_PATH, ['--json']);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`C++ Engine exited with code ${code}. Stderr: ${stderrData || 'None'}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse C++ engine JSON response: ${err.message}. Raw output: ${stdoutData.slice(0, 300)}...`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn C++ engine: ${err.message}`));
    });

    // Write input JSON to C++ engine stdin and close stream
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

module.exports = {
  runCppEngine,
  BIN_PATH
};
