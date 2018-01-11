import { join, sep } from 'path';
import controller from './controller';
import events from './events';

const name = __dirname.match(new RegExp(`\\${sep}xazure-cms-module-([^\\${sep}]+)\\${sep}`))[1];
const filePath = join(__dirname);
const publicFilePath = join(filePath, 'public');

export default { controller, events, publicFilePath, filePath, name };