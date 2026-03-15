import { describe, it, expect } from 'vitest';
import { parseMetadata, BLOCK_SHAPES, BLOCK_TEXTURES, BUTTON_SKINS } from '../lib/constants';

/**
 * LINK RENDERER LOGIC TESTS
 * Tests the metadata parsing, shape/texture/skin resolution logic
 * that powers both list and grid link rendering.
 */

describe('parseMetadata()', () => {
  it('should return empty object for null', () => {
    expect(parseMetadata(null)).toEqual({});
  });

  it('should return empty object for undefined', () => {
    expect(parseMetadata(undefined)).toEqual({});
  });

  it('should return empty object for empty string', () => {
    expect(parseMetadata('')).toEqual({});
  });

  it('should return empty object for invalid JSON', () => {
    expect(parseMetadata('not json')).toEqual({});
  });

  it('should parse valid JSON correctly', () => {
    const meta = parseMetadata('{"buttonShape":"pill","buttonTexture":"glass"}');
    expect(meta.buttonShape).toBe('pill');
    expect(meta.buttonTexture).toBe('glass');
  });

  it('should parse buttonSkinUrl correctly', () => {
    const meta = parseMetadata('{"buttonSkinUrl":"watercolor"}');
    expect(meta.buttonSkinUrl).toBe('watercolor');
  });

  it('should handle hackathon metadata', () => {
    const meta = parseMetadata('{"hackathonArea":"ti","hackathonSkills":["comunicacao","equipe"]}');
    expect(meta.hackathonArea).toBe('ti');
  });
});

describe('Per-link Override Logic', () => {
  it('blockShape "default" should fall through to global linkStyle', () => {
    const meta = parseMetadata('{"buttonShape":"default"}');
    const blockShape = meta.buttonShape || 'default';
    const globalLinkStyle = 'pill';
    const effectiveStyle = blockShape !== 'default' ? blockShape : globalLinkStyle;
    expect(effectiveStyle).toBe('pill'); // Should use global
  });

  it('blockShape "square" should override global linkStyle', () => {
    const meta = parseMetadata('{"buttonShape":"square"}');
    const blockShape = meta.buttonShape || 'default';
    const globalLinkStyle = 'pill';
    const effectiveStyle = blockShape !== 'default' ? blockShape : globalLinkStyle;
    expect(effectiveStyle).toBe('square'); // Should use per-link
  });

  it('no metadata should result in global linkStyle', () => {
    const meta = parseMetadata(null);
    const blockShape = meta.buttonShape || 'default';
    const globalLinkStyle = 'elevated';
    const effectiveStyle = blockShape !== 'default' ? blockShape : globalLinkStyle;
    expect(effectiveStyle).toBe('elevated'); // Should use global
  });

  it('skin should not affect shape logic', () => {
    const meta = parseMetadata('{"buttonSkinUrl":"watercolor","buttonShape":"pill"}');
    const blockShape = meta.buttonShape || 'default';
    const hasSkin = !!meta.buttonSkinUrl && meta.buttonSkinUrl !== 'none';
    expect(blockShape).toBe('pill');
    expect(hasSkin).toBe(true);
    // Both can coexist: skin for background, shape for border-radius
  });
});

describe('Constants Integrity', () => {
  it('BLOCK_SHAPES should include "default" option', () => {
    expect(BLOCK_SHAPES.some(s => s.value === 'default')).toBe(true);
  });

  it('BLOCK_TEXTURES should include "none" option', () => {
    expect(BLOCK_TEXTURES.some(t => t.value === 'none')).toBe(true);
  });

  it('BUTTON_SKINS should include "none" option', () => {
    expect(BUTTON_SKINS.some(s => s.value === 'none')).toBe(true);
  });

  it('all shape values should be unique', () => {
    const values = BLOCK_SHAPES.map(s => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('all texture values should be unique', () => {
    const values = BLOCK_TEXTURES.map(t => t.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('all skin values should be unique', () => {
    const values = BUTTON_SKINS.map(s => s.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
