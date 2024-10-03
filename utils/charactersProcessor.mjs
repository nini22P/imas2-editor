import * as fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'public', 'IM@S2汉化字库.txt');

const fileContent = fs.readFileSync(filePath, 'utf8');

const characters = fileContent.split('').filter(char => !['\r', '\n', ' '].includes(char));

const tsContent = `const characters = ${JSON.stringify(characters)};\nexport default characters;`;

const outputPath = path.join(process.cwd(), 'utils', 'characters.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log('已处理字库文件');
