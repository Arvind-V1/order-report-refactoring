import * as path from 'path';
import { run } from './orderReport';

const DATA_DIR = path.join(__dirname, '..', 'legacy', 'data');
const JSON_OUTPUT_PATH = path.join(__dirname, '..', 'output.json');

run(DATA_DIR, JSON_OUTPUT_PATH);