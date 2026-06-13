/**
 * Geographic Centroids for the 8 Administrative Districts of Almaty
 */
export const DISTRICT_CENTROIDS = {
  'Бостандыкский': [43.2045, 76.8872],
  'Медеуский': [43.2389, 76.9634],
  'Алмалинский': [43.2500, 76.9180],
  'Ауэзовский': [43.2260, 76.8450],
  'Алатауский': [43.2900, 76.8150],
  'Жетысуский': [43.2920, 76.9280],
  'Турксибский': [43.3320, 76.9600],
  'Наурызбайский': [43.1900, 76.8050]
};

/**
 * Fallback algorithm using Euclidean distance to approximate the closest
 * Almaty district for a given set of latitude and longitude coordinates.
 */
export const getFallbackDistrict = (lat, lng) => {
  let minDistance = Infinity;
  let closest = 'Бостандыкский';
  for (const [name, center] of Object.entries(DISTRICT_CENTROIDS)) {
    const d = Math.sqrt(Math.pow(lat - center[0], 2) + Math.pow(lng - center[1], 2));
    if (d < minDistance) {
      minDistance = d;
      closest = name;
    }
  }
  return closest;
};
