import fs from 'fs';
import path from 'path';

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

export default function handler(req, res) {
  const root = process.cwd();
  const itemsPath = path.join(root, 'public', 'items', 'items.json');
  const mapPath = path.join(root, 'public', 'spritesheets', 'itemsheet-map.json');

  const items = readJsonSafe(itemsPath);
  const map = readJsonSafe(mapPath);

  if (!items) {
    res.status(500).json({ error: 'Unable to read public/items/items.json' });
    return;
  }
  if (!map) {
    res.status(500).json({ error: 'Unable to read public/spritesheets/itemsheet-map.json' });
    return;
  }

  const itemNames = Object.keys(items);
  const mappedNames = Object.keys(map);

  const mappedSet = new Set(mappedNames);
  const itemSet = new Set(itemNames);

  const missingFromTexturePack = [];
  for (const name of itemNames) {
    if (!mappedSet.has(name)) missingFromTexturePack.push(name);
  }

  const orphansInMap = [];
  for (const name of mappedNames) {
    if (!itemSet.has(name)) orphansInMap.push(name);
  }

  res.status(200).json({
    totals: {
      items: itemNames.length,
      mapped: mappedNames.length,
      missing: missingFromTexturePack.length,
      mapOrphans: orphansInMap.length,
      mappedPercent: itemNames.length ? (mappedNames.length / itemNames.length) : 0,
    },
    samples: {
      missingFirst50: missingFromTexturePack.slice(0, 50),
      orphansFirst50: orphansInMap.slice(0, 50),
    },
  });
}
