import * as fs from 'fs';

export function printReport(reportText: string): void {
  console.log(reportText);
}

export function writeJsonExport(filePath: string, jsonContent: string): void {
  fs.writeFileSync(filePath, jsonContent);
}