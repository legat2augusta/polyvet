import { describe, it, expect } from 'vitest';
import { calculateVectorSimilarity } from '../imageAI';

describe('calculateVectorSimilarity', () => {
  it('should return 100 for identical pre-normalized vectors', () => {
    const vec = [1, 0, 0, 0];
    expect(calculateVectorSimilarity(vec, vec)).toBe(100);
  });

  it('should return 0 for orthogonal pre-normalized vectors', () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [0, 1, 0, 0];
    expect(calculateVectorSimilarity(vecA, vecB)).toBe(0);
  });

  it('should correctly calculate and map similarity for partially matching vectors', () => {
    // Both vectors normalized, dot product = 0.8 * 0.6 + 0.6 * 0.8 = 0.96
    const vecA = [0.8, 0.6, 0, 0];
    const vecB = [0.6, 0.8, 0, 0];
    expect(calculateVectorSimilarity(vecA, vecB)).toBe(96);
  });

  it('should return 0 if either vector is missing or have different dimensions', () => {
    expect(calculateVectorSimilarity(null, [1, 2])).toBe(0);
    expect(calculateVectorSimilarity([1, 2], undefined)).toBe(0);
    expect(calculateVectorSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});
