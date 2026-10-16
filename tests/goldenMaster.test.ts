import * as fs from 'fs';
import * as path from 'path';
import { loadReportData } from '../src/io/dataLoader';
import { generateReport, GeneratedReport } from '../src/orderReport';
import { serializeJsonExport } from '../src/report/jsonExport';
import { run as runLegacy } from '../legacy/orderReportLegacy';

const DATA_DIR = path.join(__dirname, '..', 'legacy', 'data');
const EXPECTED_PATH = path.join(__dirname, '..', 'legacy', 'expected', 'report.txt');
const LEGACY_JSON_PATH = path.join(__dirname, '..', 'legacy', 'output.json');

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
  let legacyReport: string;
  let legacyJson: string;
  let refactored: GeneratedReport;

  beforeAll(() => {
    legacyReport = withoutConsoleOutput(() => runLegacy());
    legacyJson = fs.readFileSync(LEGACY_JSON_PATH, 'utf-8');
    refactored = generateReport(loadReportData(DATA_DIR));
  });

  it('le legacy produit exactement la sortie de référence', () => {
    expect(legacyReport).toBe(readOrRecordReference(legacyReport));
  });

  it('le code refactoré produit exactement la sortie de référence', () => {
    expect(refactored.text).toBe(fs.readFileSync(EXPECTED_PATH, 'utf-8'));
  });

  it('le code refactoré produit exactement le même export JSON que le legacy', () => {
    expect(serializeJsonExport(refactored.json)).toBe(legacyJson);
  });
});