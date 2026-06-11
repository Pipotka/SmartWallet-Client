import { describe, it, expect, beforeEach } from 'vitest';
import { getColor, getColorMap, clearColors } from './colorManager';
import { CHART_COLORS } from './constants';

describe('colorManager', () => {
  beforeEach(() => {
    localStorage.clear();
    clearColors();
  });

  describe('getColor', () => {
    it('returns a color from the palette for a new ID', () => {
      const color = getColor('cat-1');
      expect(CHART_COLORS).toContain(color);
    });

    it('returns the same color on repeated calls with the same ID', () => {
      const first = getColor('cat-1');
      const second = getColor('cat-1');
      expect(first).toBe(second);
    });

    it('assigns different colors to different IDs', () => {
      const color1 = getColor('cat-1');
      const color2 = getColor('cat-2');
      expect(color1).not.toBe(color2);
    });

    it('assigns colors sequentially from the palette', () => {
      const color1 = getColor('cat-1');
      const color2 = getColor('cat-2');
      const color3 = getColor('cat-3');
      expect(color1).toBe(CHART_COLORS[0]);
      expect(color2).toBe(CHART_COLORS[1]);
      expect(color3).toBe(CHART_COLORS[2]);
    });

    it('cycles through the palette when exceeding its length', () => {
      const colors: string[] = [];
      for (let i = 0; i < CHART_COLORS.length + 5; i++) {
        colors.push(getColor(`cat-${i}`));
      }
      // First 20 should match palette exactly
      for (let i = 0; i < CHART_COLORS.length; i++) {
        expect(colors[i]).toBe(CHART_COLORS[i]);
      }
      // Next 5 should cycle back
      for (let i = CHART_COLORS.length; i < CHART_COLORS.length + 5; i++) {
        expect(colors[i]).toBe(CHART_COLORS[i % CHART_COLORS.length]);
      }
    });

    it('persists mapping to localStorage', () => {
      getColor('cat-1');
      const stored = JSON.parse(localStorage.getItem('chart-category-colors')!);
      expect(stored['cat-1']).toBe(CHART_COLORS[0]);
    });

    it('loads existing mapping from localStorage on init', () => {
      // Simulate a pre-existing mapping in localStorage
      clearColors();
      localStorage.setItem(
        'chart-category-colors',
        JSON.stringify({ 'existing-cat': '#FF0000' })
      );
      // Force cache invalidation so the next getColor reads from localStorage
      // clearColors clears both cache and localStorage, so we set localStorage after it
      const color = getColor('existing-cat');
      expect(color).toBe('#FF0000');
    });
  });

  describe('getColorMap', () => {
    it('returns a Map with colors for all provided IDs', () => {
      const ids = ['cat-1', 'cat-2', 'cat-3'];
      const map = getColorMap(ids);
      expect(map.size).toBe(3);
      expect(map.get('cat-1')).toBe(CHART_COLORS[0]);
      expect(map.get('cat-2')).toBe(CHART_COLORS[1]);
      expect(map.get('cat-3')).toBe(CHART_COLORS[2]);
    });
  });

  describe('clearColors', () => {
    it('clears the mapping from localStorage and cache', () => {
      getColor('cat-1');
      clearColors();
      expect(localStorage.getItem('chart-category-colors')).toBeNull();
      // After clearing, next call should reassign from palette start
      const color = getColor('cat-1');
      expect(color).toBe(CHART_COLORS[0]);
    });
  });
});
