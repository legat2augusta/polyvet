import { describe, it, expect } from 'vitest';
import { getFallbackDistrict, DISTRICT_CENTROIDS } from '../geoUtils';

describe('getFallbackDistrict', () => {
  it('should resolve coordinates close to Bostandyk center to Bostandyk', () => {
    // Exactly at Bostandyk centroid
    const [lat, lng] = DISTRICT_CENTROIDS['Бостандыкский'];
    expect(getFallbackDistrict(lat, lng)).toBe('Бостандыкский');

    // Slightly shifted
    expect(getFallbackDistrict(lat + 0.005, lng - 0.005)).toBe('Бостандыкский');
  });

  it('should resolve coordinates close to Medeu center to Medeu', () => {
    const [lat, lng] = DISTRICT_CENTROIDS['Медеуский'];
    expect(getFallbackDistrict(lat, lng)).toBe('Медеуский');
    expect(getFallbackDistrict(lat - 0.002, lng + 0.004)).toBe('Медеуский');
  });

  it('should resolve coordinates close to Almaly center to Almaly', () => {
    const [lat, lng] = DISTRICT_CENTROIDS['Алмалинский'];
    expect(getFallbackDistrict(lat, lng)).toBe('Алмалинский');
    expect(getFallbackDistrict(lat + 0.001, lng - 0.002)).toBe('Алмалинский');
  });

  it('should fall back to default even with invalid coordinates', () => {
    // Very far away should still pick the closest among Almaty districts
    expect(getFallbackDistrict(0, 0)).toBeDefined();
    expect(getFallbackDistrict(100, -100)).toBeDefined();
  });
});
