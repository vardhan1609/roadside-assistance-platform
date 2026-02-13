import { useState } from 'react';

export function useLocation() {
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      setLocLoading(true);
      setLocError('');
      if (!navigator.geolocation) {
        setLocError('Geolocation not supported by this browser');
        setLocLoading(false);
        reject(new Error('Not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          try {
            // Use OpenStreetMap Nominatim (free, no API key needed)
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
              address = data.display_name;
            }
          } catch (err) {
            // Fallback to coordinates if reverse geocoding fails
          }
          setLocLoading(false);
          resolve({ latitude, longitude, address });
        },
        (error) => {
          let msg = 'Could not get location';
          if (error.code === 1) msg = 'Location access denied. Please allow location access.';
          if (error.code === 2) msg = 'Location unavailable. Try again.';
          if (error.code === 3) msg = 'Location request timed out.';
          setLocError(msg);
          setLocLoading(false);
          reject(new Error(msg));
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  return { getLocation, locLoading, locError };
}
