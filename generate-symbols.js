import fs from 'fs';
import { createCanvas } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const symbols = {
  'CHERRY': { text: '🍒', color: '#e74c3c' },
  'LEMON': { text: '🍋', color: '#f1c40f' },
  'ORANGE': { text: '🍊', color: '#e67e22' },
  'WATERMELON': { text: '🍉', color: '#2ecc71' },
  'BELL': { text: '🔔', color: '#f39c12' },
  'BAR': { text: 'BAR', color: '#34495e' },
  'DIAMOND': { text: '💎', color: '#3498db' },
  'SEVEN': { text: '7', color: '#9b59b6' }
};

const outputDir = path.join(__dirname, 'demo', 'assets', 'classic');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const [name, { text, color }] of Object.entries(symbols)) {
  const canvas = createCanvas(150, 150);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 150, 150);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 146, 146);

  // Text/Emoji
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 75, 75);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const filename = `symbol-${name}.png`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  console.log(`Created ${filename}`);
}

console.log('\nAll symbol images created successfully!');
