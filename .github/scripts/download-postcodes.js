/* eslint-disable no-console */
// This script downloads the Norwegian postal code registry and generates
// an indexed-places JSON format for efficient storage and lookup.
// Run with: node download-postcodes.js

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_URL = 'https://www.bring.no/postnummerregister-ansi.txt';
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'postcodes');

async function downloadData() {
  console.log(`Downloading from ${DATA_URL}...`);
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  // The file is ANSI encoded (Windows-1252/ISO-8859-1)
  const decoder = new TextDecoder('windows-1252');
  return decoder.decode(buffer);
}

function parseData(raw) {
  const lines = raw.trim().split('\n');
  const entries = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const zip = parts[0].trim();
      const place = parts[1].trim();
      if (zip && place && /^\d{4}$/.test(zip)) {
        entries.push({ zip, place });
      }
    }
  }

  console.log(`Parsed ${entries.length} postal entries`);
  return entries;
}

function generateIndexedPlaces(entries) {
  const placeToIndex = new Map();
  const places = [null]; // Index 0 = not assigned
  const mapping = new Array(10000).fill(0);

  for (const { zip, place } of entries) {
    let placeIndex = placeToIndex.get(place);
    if (placeIndex === undefined) {
      placeIndex = places.length;
      places.push(place);
      placeToIndex.set(place, placeIndex);
    }
    mapping[parseInt(zip, 10)] = placeIndex;
  }

  console.log(`Unique place names: ${places.length - 1}`);
  return { places, mapping };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  const raw = await downloadData();
  const entries = parseData(raw);

  const indexedPlaces = generateIndexedPlaces(entries);

  const filepath = path.join(OUTPUT_DIR, 'registry.json');
  const json = JSON.stringify(indexedPlaces);
  fs.writeFileSync(filepath, json, 'utf-8');

  const stats = fs.statSync(filepath);
  console.log(`Written postcodes/registry.json: ${stats.size} bytes`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
