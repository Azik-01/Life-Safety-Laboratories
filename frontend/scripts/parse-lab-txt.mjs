import fs from 'node:fs/promises';
import path from 'node:path';

const WORKDIR = process.cwd();
const CANDIDATE_SOURCES = [
  path.resolve(WORKDIR, '../files/labs doc'),
  path.resolve(WORKDIR, '../labs doc'),
];
const OUTPUT_DIR = path.resolve(WORKDIR, 'src/content/labs/parsed');

function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectBlockType(text) {
  const line = text.trim();

  if (/^лабораторная работа/i.test(line)) return 'heading';
  if (/^\d+(\.\d+)*[.)]?\s+[А-ЯA-Z]/u.test(line)) return 'heading';
  if (/^[-*•]\s+/u.test(line)) return 'listItem';
  if (/^\d+[.)]\s+/u.test(line)) return 'listItem';

  return 'paragraph';
}

function splitBlocks(raw) {
  const chunks = raw
    .split(/\n\s*\n/gu)
    .map((item) => item.trim())
    .filter(Boolean);

  return chunks.map((text, index) => ({
    index: index + 1,
    type: detectBlockType(text),
    text,
  }));
}

function parseLabNumber(filename) {
  const match = filename.match(/lab txt (\d+)\.txt/i);
  if (!match) return null;
  return Number(match[1]);
}

async function resolveSourceDir() {
  for (const source of CANDIDATE_SOURCES) {
    try {
      const stat = await fs.stat(source);
      if (stat.isDirectory()) return source;
    } catch {
      // try next path
    }
  }
  throw new Error(
    `Source directory not found. Checked: ${CANDIDATE_SOURCES.join(', ')}`
  );
}

async function main() {
  const sourceDir = await resolveSourceDir();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await fs.readdir(sourceDir))
    .filter((name) => /lab txt \d+\.txt/i.test(name))
    .sort((a, b) => {
      const aNum = parseLabNumber(a) ?? 0;
      const bNum = parseLabNumber(b) ?? 0;
      return aNum - bNum;
    });

  if (files.length === 0) {
    throw new Error(`No lab txt files found in ${sourceDir}`);
  }

  const index = [];

  for (const fileName of files) {
    const labNumber = parseLabNumber(fileName);
    if (!labNumber) continue;

    const sourcePath = path.join(sourceDir, fileName);
    const raw = await fs.readFile(sourcePath, 'utf-8');
    const normalized = normalizeText(raw);
    const blocks = splitBlocks(normalized);

    const titleBlock = blocks.find((item) => item.type === 'heading');
    const title =
      titleBlock?.text.split('\n')[0] ??
      normalized.split('\n')[0] ??
      `Лабораторная работа ${labNumber}`;

    const output = {
      id: `lab-${labNumber}`,
      sourceFile: fileName,
      sourcePath,
      extractedAt: new Date().toISOString(),
      title,
      stats: {
        charCount: normalized.length,
        lineCount: normalized.split('\n').length,
        blockCount: blocks.length,
      },
      blocks,
    };

    const outputPath = path.join(
      OUTPUT_DIR,
      `lab-${labNumber}.parsed.json`
    );
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    index.push({
      id: output.id,
      sourceFile: fileName,
      title: output.title,
      blockCount: output.stats.blockCount,
      outputPath: path.relative(WORKDIR, outputPath),
    });
  }

  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

  console.log(`Parsed ${index.length} files from ${sourceDir}`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

