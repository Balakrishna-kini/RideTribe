/**
 * Deterministically get an image for a ride based on its route.
 */
export const getRideImage = (ride) => {
  if (ride.image) return ride.image;

  const pool = [
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc', // Black Cruiser
    'https://images.unsplash.com/photo-1558981420-c532902e58b4', // Neon Bike
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39', // Classic Bike
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87', // Sport Bike
    'https://images.unsplash.com/photo-1558980331-098527c4c4c4', // Adventure Bike
    'https://images.unsplash.com/photo-1558980394-4c7c9299fe96', // Scrambler
    'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838', // High Speed
    'https://images.unsplash.com/photo-1449495169669-7b118f960237', // Coastal Rider
  ];

  const start = (ride.startLocation || ride.start_location || '').toLowerCase();
  const end = (ride.endLocation || ride.end_location || '').toLowerCase();
  const id = String(ride.id || '');
  const routeStr = `${start}${end}${id}`;

  if (!routeStr) return `${pool[0]}?w=800&q=80`;

  let hash = 0;
  for (let i = 0; i < routeStr.length; i++) {
    hash = routeStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % pool.length;
  return `${pool[index]}?w=800&q=80`;
};

/**
 * Calculate Haversine distance between two points in km
 */
export const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
