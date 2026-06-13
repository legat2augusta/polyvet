import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFallbackDistrict, DISTRICT_CENTROIDS, extractExifGPS } from '../geoUtils';
import ExifReader from 'exifreader';

vi.mock('exifreader', () => {
  return {
    default: {
      load: vi.fn()
    }
  };
});

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

describe('extractExifGPS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parsed latitude and longitude if GPS tags exist', async () => {
    ExifReader.load.mockResolvedValue({
      gps: {
        Latitude: 43.2389,
        Longitude: 76.9634
      }
    });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifGPS(file);

    expect(ExifReader.load).toHaveBeenCalledWith(file, { expanded: true });
    expect(result).toEqual({ latitude: 43.2389, longitude: 76.9634 });
  });

  it('should return null if no GPS tags exist', async () => {
    ExifReader.load.mockResolvedValue({
      Model: { description: 'Canon' }
    });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifGPS(file);

    expect(result).toBeNull();
  });

  it('should return null if ExifReader throws an error', async () => {
    ExifReader.load.mockRejectedValue(new Error('Invalid image format'));

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await extractExifGPS(file);

    expect(result).toBeNull();
  });
});
