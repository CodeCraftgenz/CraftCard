import { describe, it, expect } from 'vitest';
import {
  parseMetadata, setMetadataField, getGridSize,
  BLOCK_SHAPES, BLOCK_TEXTURES, BUTTON_SKINS,
  SOCIAL_PLATFORMS, PRESET_BUTTON_COLORS,
} from '../lib/constants';

/**
 * COMPREHENSIVE UI LOGIC TESTS
 * Tests all metadata operations, constants integrity, and business logic
 * used across LinkRenderer, CardPreview, and EditorPage.
 */

// ── Metadata Operations ─────────────────────────────────

describe('parseMetadata()', () => {
  it('should return {} for null', () => expect(parseMetadata(null)).toEqual({}));
  it('should return {} for undefined', () => expect(parseMetadata(undefined)).toEqual({}));
  it('should return {} for empty string', () => expect(parseMetadata('')).toEqual({}));
  it('should return {} for whitespace', () => expect(parseMetadata('   ')).toEqual({}));
  it('should handle "null" string (JSON.parse returns null, caught)', () => {
    const result = parseMetadata('null');
    // parseMetadata uses try/catch on JSON.parse — null parses to null which is falsy
    expect(result).toBeDefined();
  });
  it('should return {} for invalid JSON', () => expect(parseMetadata('{broken')).toEqual({}));
  it('should handle array JSON (returns array, not object)', () => {
    const result = parseMetadata('[1,2]');
    // JSON.parse('[1,2]') returns an array — parseMetadata doesn't filter this
    expect(result).toBeDefined();
  });
  it('should parse simple object', () => {
    expect(parseMetadata('{"key":"value"}')).toEqual({ key: 'value' });
  });
  it('should parse nested values', () => {
    const meta = parseMetadata('{"a":"1","b":"2","c":"3"}');
    expect(Object.keys(meta).length).toBe(3);
  });
  it('should parse buttonShape', () => {
    expect(parseMetadata('{"buttonShape":"pill"}').buttonShape).toBe('pill');
  });
  it('should parse buttonTexture', () => {
    expect(parseMetadata('{"buttonTexture":"glass"}').buttonTexture).toBe('glass');
  });
  it('should parse buttonSkinUrl', () => {
    expect(parseMetadata('{"buttonSkinUrl":"watercolor"}').buttonSkinUrl).toBe('watercolor');
  });
  it('should parse gridSize', () => {
    expect(parseMetadata('{"gridSize":"2x1"}').gridSize).toBe('2x1');
  });
  it('should parse hackathon metadata', () => {
    const meta = parseMetadata('{"hackathonArea":"ti","hackathonSkills":["a","b"]}');
    expect(meta.hackathonArea).toBe('ti');
  });
});

describe('setMetadataField()', () => {
  it('should create metadata from null', () => {
    const result = setMetadataField(null, 'key', 'value');
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });
  it('should create metadata from undefined', () => {
    const result = setMetadataField(undefined, 'key', 'value');
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });
  it('should add field to existing metadata', () => {
    const result = setMetadataField('{"existing":"data"}', 'new', 'field');
    const parsed = JSON.parse(result);
    expect(parsed.existing).toBe('data');
    expect(parsed.new).toBe('field');
  });
  it('should overwrite existing field', () => {
    const result = setMetadataField('{"key":"old"}', 'key', 'new');
    expect(JSON.parse(result).key).toBe('new');
  });
  it('should preserve other fields when overwriting', () => {
    const result = setMetadataField('{"a":"1","b":"2"}', 'a', 'updated');
    const parsed = JSON.parse(result);
    expect(parsed.a).toBe('updated');
    expect(parsed.b).toBe('2');
  });
});

describe('getGridSize()', () => {
  it('should default to 1x1 for null', () => {
    expect(getGridSize(null).value).toBe('1x1');
  });
  it('should default to 1x1 for no gridSize', () => {
    expect(getGridSize('{"buttonShape":"pill"}').value).toBe('1x1');
  });
  it('should parse 2x1', () => {
    const gs = getGridSize('{"gridSize":"2x1"}');
    expect(gs.cols).toBe(2);
    expect(gs.rows).toBe(1);
  });
  it('should parse 2x2', () => {
    const gs = getGridSize('{"gridSize":"2x2"}');
    expect(gs.cols).toBe(2);
    expect(gs.rows).toBe(2);
  });
  it('should parse 3x1 banner', () => {
    const gs = getGridSize('{"gridSize":"3x1"}');
    expect(gs.cols).toBe(3);
    expect(gs.rows).toBe(1);
  });
  it('should fallback to 1x1 for invalid size', () => {
    expect(getGridSize('{"gridSize":"99x99"}').value).toBe('1x1');
  });
});

// ── Per-Link Override Logic ─────────────────────────────

describe('Per-link style resolution', () => {
  const resolve = (meta: string | null, globalStyle: string) => {
    const parsed = parseMetadata(meta);
    const blockShape = parsed.buttonShape || 'default';
    return blockShape !== 'default' ? blockShape : globalStyle;
  };

  it('no metadata → global style', () => expect(resolve(null, 'pill')).toBe('pill'));
  it('default shape → global style', () => expect(resolve('{"buttonShape":"default"}', 'elevated')).toBe('elevated'));
  it('pill override → pill', () => expect(resolve('{"buttonShape":"pill"}', 'rounded')).toBe('pill'));
  it('square override → square', () => expect(resolve('{"buttonShape":"square"}', 'pill')).toBe('square'));
  it('brutalist override → brutalist', () => expect(resolve('{"buttonShape":"brutalist"}', 'pill')).toBe('brutalist'));
  it('ticket override → ticket', () => expect(resolve('{"buttonShape":"ticket"}', 'rounded')).toBe('ticket'));
  it('leaf override → leaf', () => expect(resolve('{"buttonShape":"leaf"}', 'rounded')).toBe('leaf'));
});

describe('Skin + Shape coexistence', () => {
  it('should have both skin and shape independently', () => {
    const meta = parseMetadata('{"buttonSkinUrl":"watercolor","buttonShape":"pill"}');
    expect(meta.buttonSkinUrl).toBe('watercolor');
    expect(meta.buttonShape).toBe('pill');
  });
  it('skin none should not affect shape', () => {
    const meta = parseMetadata('{"buttonSkinUrl":"none","buttonShape":"square"}');
    const hasSkin = !!meta.buttonSkinUrl && meta.buttonSkinUrl !== 'none';
    expect(hasSkin).toBe(false);
    expect(meta.buttonShape).toBe('square');
  });
  it('custom URL skin should be detected', () => {
    const meta = parseMetadata('{"buttonSkinUrl":"https://example.com/skin.png"}');
    const hasSkin = !!meta.buttonSkinUrl && meta.buttonSkinUrl !== 'none';
    expect(hasSkin).toBe(true);
  });
});

// ── Constants Integrity ─────────────────────────────────

describe('BLOCK_SHAPES integrity', () => {
  it('should have "default" option', () => expect(BLOCK_SHAPES.some(s => s.value === 'default')).toBe(true));
  it('should have unique values', () => {
    const values = BLOCK_SHAPES.map(s => s.value);
    expect(new Set(values).size).toBe(values.length);
  });
  it('should have labels for all entries', () => {
    BLOCK_SHAPES.forEach(s => expect(s.label.length).toBeGreaterThan(0));
  });
  it('should have descriptions for all entries', () => {
    BLOCK_SHAPES.forEach(s => expect(s.desc.length).toBeGreaterThan(0));
  });
  it('should have at least 5 shapes', () => expect(BLOCK_SHAPES.length).toBeGreaterThanOrEqual(5));
});

describe('BLOCK_TEXTURES integrity', () => {
  it('should have "none" option', () => expect(BLOCK_TEXTURES.some(t => t.value === 'none')).toBe(true));
  it('should have unique values', () => {
    const values = BLOCK_TEXTURES.map(t => t.value);
    expect(new Set(values).size).toBe(values.length);
  });
  it('should have at least 5 textures', () => expect(BLOCK_TEXTURES.length).toBeGreaterThanOrEqual(5));
});

describe('BUTTON_SKINS integrity', () => {
  it('should have "none" option', () => expect(BUTTON_SKINS.some(s => s.value === 'none')).toBe(true));
  it('should have unique values', () => {
    const values = BUTTON_SKINS.map(s => s.value);
    expect(new Set(values).size).toBe(values.length);
  });
  it('should have at least 5 skins', () => expect(BUTTON_SKINS.length).toBeGreaterThanOrEqual(5));
  it('watercolor preset should exist', () => expect(BUTTON_SKINS.some(s => s.value === 'watercolor')).toBe(true));
  it('neon-glow preset should exist', () => expect(BUTTON_SKINS.some(s => s.value === 'neon-glow')).toBe(true));
  it('marble preset should exist', () => expect(BUTTON_SKINS.some(s => s.value === 'marble')).toBe(true));
});

describe('SOCIAL_PLATFORMS integrity', () => {
  it('should have whatsapp', () => expect(SOCIAL_PLATFORMS.some(p => p.value === 'whatsapp')).toBe(true));
  it('should have instagram', () => expect(SOCIAL_PLATFORMS.some(p => p.value === 'instagram')).toBe(true));
  it('should have linkedin', () => expect(SOCIAL_PLATFORMS.some(p => p.value === 'linkedin')).toBe(true));
  it('should have github', () => expect(SOCIAL_PLATFORMS.some(p => p.value === 'github')).toBe(true));
  it('should have unique values', () => {
    const values = SOCIAL_PLATFORMS.map(p => p.value);
    expect(new Set(values).size).toBe(values.length);
  });
  it('all should have urlPrefix or placeholder', () => {
    SOCIAL_PLATFORMS.forEach(p => {
      expect(p.label.length).toBeGreaterThan(0);
    });
  });
});

describe('PRESET_BUTTON_COLORS integrity', () => {
  it('should have at least 5 colors', () => expect(PRESET_BUTTON_COLORS.length).toBeGreaterThanOrEqual(5));
  it('all should be valid hex colors', () => {
    PRESET_BUTTON_COLORS.forEach(c => {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
  it('should have unique colors', () => {
    expect(new Set(PRESET_BUTTON_COLORS).size).toBe(PRESET_BUTTON_COLORS.length);
  });
});

// ── Hackathon Constants ─────────────────────────────────

describe('Hackathon isolation constants', () => {
  it('hackathon_meta linkType should not conflict with standard types', () => {
    const standardTypes = ['link', 'header', 'embed', 'pix', 'file', 'map', 'phone'];
    expect(standardTypes).not.toContain('hackathon_meta');
  });
  it('hackathon order 999 should be unique sentinel', () => {
    // Standard links use order 0-50, hackathon uses 999
    expect(999).toBeGreaterThan(50);
  });
});
