import { describe, it, expect } from 'vitest';
import { getTranslation } from '../translations';

describe('getTranslation', () => {
  it('should return correct translation in Russian', () => {
    expect(getTranslation('logoSub', 'ru')).toBe('Алматы');
    expect(getTranslation('statusLost', 'ru')).toBe('Пропал');
    expect(getTranslation('cardDistrict', 'ru')).toBe('район');
  });

  it('should return correct translation in Kazakh', () => {
    expect(getTranslation('logoSub', 'kk')).toBe('Алматы');
    expect(getTranslation('statusLost', 'kk')).toBe('Жоғалды');
    expect(getTranslation('cardDistrict', 'kk')).toBe('ауданы');
  });

  it('should fall back to Russian translation if the requested language key is missing', () => {
    // Let's assume we pass an unsupported lang code, it should fallback to 'ru'
    expect(getTranslation('statusLost', 'en')).toBe('Пропал');
  });

  it('should return the key itself if the key is missing in all languages', () => {
    const missingKey = 'non_existent_key_123_abc';
    expect(getTranslation(missingKey, 'ru')).toBe(missingKey);
    expect(getTranslation(missingKey, 'kk')).toBe(missingKey);
  });
});
