import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import imageMap from '@/data/exerciseImageMap.json';

describe('exerciseImageMap', () => {
  it('points every matched exercise to an existing local image file in public/', () => {
    const entries = Object.entries(imageMap);
    expect(entries.length).toBeGreaterThanOrEqual(409);

    const matched = entries.filter(
      ([, val]) => val.imageStatus === 'matched' || val.imageStatus === 'manually_verified'
    );
    expect(matched.length).toBe(entries.length);

    for (const [id, val] of matched) {
      expect(val.image, `Missing image path for ${id}`).toBeTruthy();
      const filePath = path.resolve(process.cwd(), 'public', val.image as string);
      expect(fs.existsSync(filePath), `Image file missing on disk: ${filePath}`).toBe(true);
    }
  });
});
