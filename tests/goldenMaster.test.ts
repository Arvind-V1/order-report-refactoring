import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { run as runLegacy } from '../legacy/orderReportLegacy';
import { run as runRefactored } from '../src/orderReport';

const DATA_DIR = path.join(__dirname, '..', 'legacy', 'data');
const EXPECTED_PATH = path.join(__dirname, '..', 'legacy', 'expected', 'report.txt');

function withoutConsoleOutput<T>(action: () => T): T {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  try {
    return action();
  } finally {
    logSpy.mockRestore();
  }
}

function readOrRecordReference(legacyReport: string): string {
  if (!fs.existsSync(EXPECTED_PATH)) {
    fs.mkdirSync(path.dirname(EXPECTED_PATH), { recursive: true });
    fs.writeFileSync(EXPECTED_PATH, legacyReport);
  }
  return fs.readFileSync(EXPECTED_PATH, 'utf-8');
}

describe('Golden master', () => {
  it('le legacy produit exactement la sortie de référence', () => {
    const legacyReport = withoutConsoleOutput(() => runLegacy());

    expect(legacyReport).toBe(readOrRecordReference(legacyReport));
  });

  it('le code refactoré produit exactement la sortie de référence', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'order-report-'));
    const jsonOutputPath = path.join(tmpDir, 'output.json');

    const report = withoutConsoleOutput(() => runRefactored(DATA_DIR, jsonOutputPath));

    expect(report).toBe(fs.readFileSync(EXPECTED_PATH, 'utf-8'));
  });
});