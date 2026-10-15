import * as fs from 'fs';
import * as path from 'path';
import { run as runLegacy } from '../legacy/orderReportLegacy';

const EXPECTED_PATH = path.join(__dirname, '..', 'legacy', 'expected', 'report.txt');

function captureLegacyReport(): string {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  try {
    return runLegacy();
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
    const legacyReport = captureLegacyReport();
    const reference = readOrRecordReference(legacyReport);

    expect(legacyReport).toBe(reference);
  });
});