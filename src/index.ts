import * as path from 'path';
import { loadReportData } from './io/dataLoader';
import { printReport, writeJsonExport } from './io/reportWriter';
import { generateReport } from './orderReport';
import { serializeJsonExport } from './report/jsonExport';

const DATA_DIR = path.join(__dirname, '..', 'legacy', 'data');
const JSON_OUTPUT_PATH = path.join(__dirname, '..', 'output.json');

const report = generateReport(loadReportData(DATA_DIR));
printReport(report.text);
writeJsonExport(JSON_OUTPUT_PATH, serializeJsonExport(report.json));
