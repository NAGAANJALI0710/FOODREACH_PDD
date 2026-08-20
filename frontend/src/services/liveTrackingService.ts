import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DonationService } from './donationService';

interface ActiveSession {
  locationSubscription?: Location.LocationSubscription;
  intervalId?: any;
  watchId?: number;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

const activeSessions: Map<string, ActiveSession> = new Map();

export class LiveTrackingService {
  /**
   * Request location permission and start updating representative's live GPS coordinates on current donation row
   */
  static async startTracking(
    donationId: string,
    token?: string | null,
    onUpdate?: (coords: { latitude: number; longitude: number }) => void
  ): Promise<{ success: boolean; message: string }> {
    console.log(`[LiveTrackingService] Platform.OS: ${Platform.OS}`);

    if (activeSessions.has(donationId)) {
      console.log(`[LiveTrackingService] Tracking session already active for donation: ${donationId}`);
      return { success: true, message: 'Tracking session already active' };
    }

    // ── Native Mobile Platform (Android & iOS) ─────────────────────────
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log(`[LiveTrackingService] Permission result: ${status}`);

        if (status !== 'granted') {
          return { success: false, message: 'Location permission denied. Please enable GPS in your device settings.' };
        }

        // Get initial GPS location & verify coordinates exist
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!initialLoc || !initialLoc.coords) {
          return { success: false, message: 'Failed to obtain initial GPS coordinates.' };
        }

        const lat = initialLoc.coords.latitude;
        const lng = initialLoc.coords.longitude;

        console.log(`[LiveTrackingService] GPS started for donation: ${donationId}`);
        console.log(`[LiveTrackingService] Latitude: ${lat}, Longitude: ${lng}`);

        // Update driver columns on current donation row
        const updateRes = await DonationService.updateLiveLocation(donationId, lat, lng, token, 'Active').catch(() => null);
        console.log(`[LiveTrackingService] Supabase update success: ${Boolean(updateRes?.success)}`);

        if (onUpdate) onUpdate({ latitude: lat, longitude: lng });

        // Start continuous position watcher using expo-location every 5 seconds
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 5, // Or every 5 meters
          },
          async (location) => {
            if (location && location.coords) {
              const currentLat = location.coords.latitude;
              const currentLng = location.coords.longitude;

              console.log(`[LiveTrackingService] Latitude: ${currentLat}, Longitude: ${currentLng}`);

              const session = activeSessions.get(donationId);
              if (session) {
                session.latitude = currentLat;
                session.longitude = currentLng;
                session.lastUpdated = new Date();
              }

              const res = await DonationService.updateLiveLocation(donationId, currentLat, currentLng, token, 'Active').catch(() => null);
              console.log(`[LiveTrackingService] Supabase update success: ${Boolean(res?.success)}`);

              if (onUpdate) onUpdate({ latitude: currentLat, longitude: currentLng });
            }
          }
        );

        activeSessions.set(donationId, {
          locationSubscription: subscription,
          latitude: lat,
          longitude: lng,
          lastUpdated: new Date(),
        });

        return { success: true, message: 'Live GPS location tracking active' };
      } catch (error: any) {
        console.error('[LiveTrackingService] Mobile location error:', error?.message || error);
        return { success: false, message: `GPS error: ${error?.message || 'Failed to start GPS tracking'}` };
      }
    }

    // ── Web Browser Platform ──────────────────────────────────────────
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log(`[LiveTrackingService] Permission result: granted`);
            console.log(`[LiveTrackingService] GPS started for donation: ${donationId}`);
            console.log(`[LiveTrackingService] Latitude: ${lat}, Longitude: ${lng}`);

            const updateRes = await DonationService.updateLiveLocation(donationId, lat, lng, token, 'Active').catch(() => null);
            console.log(`[LiveTrackingService] Supabase update success: ${Boolean(updateRes?.success)}`);

            if (onUpdate) onUpdate({ latitude: lat, longitude: lng });

            const intervalId = setInterval(() => {
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const currentLat = pos.coords.latitude;
                  const currentLng = pos.coords.longitude;

                  console.log(`[LiveTrackingService] Latitude: ${currentLat}, Longitude: ${currentLng}`);

                  const session = activeSessions.get(donationId);
                  if (session) {
                    session.latitude = currentLat;
                    session.longitude = currentLng;
                    session.lastUpdated = new Date();
                  }

                  const res = await DonationService.updateLiveLocation(donationId, currentLat, currentLng, token, 'Active').catch(() => null);
                  console.log(`[LiveTrackingService] Supabase update success: ${Boolean(res?.success)}`);

                  if (onUpdate) onUpdate({ latitude: currentLat, longitude: currentLng });
                },
                (err) => {
                  console.warn('[LiveTrackingService] Web location error:', err.message);
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
              );
            }, 5000);

            activeSessions.set(donationId, {
              intervalId,
              latitude: lat,
              longitude: lng,
              lastUpdated: new Date(),
            });

            resolve({ success: true, message: 'Live GPS location tracking active' });
          },
          (error) => {
            console.error('[LiveTrackingService] Web geolocation permission denied or failed:', error.message);
            resolve({ success: false, message: 'Location permission denied. Please enable browser GPS.' });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    return { success: false, message: 'Location services are unavailable on this browser.' };
  }

  /**
   * Stop active GPS tracking session immediately & set driver_tracking_status='Completed'
   */
  static stopTracking(donationId: string): void {
    const session = activeSessions.get(donationId);
    if (session) {
      if (session.locationSubscription) {
        try {
          session.locationSubscription.remove();
        } catch (_) {}
      }
      if (session.intervalId) {
        clearInterval(session.intervalId);
      }
      if (session.watchId !== undefined && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(session.watchId);
      }
      activeSessions.delete(donationId);
      console.log(`[LiveTrackingService] Stopped tracking session for donation: ${donationId}`);
    }

    // Set driver_tracking_status='Completed' on current donation row in Supabase
    DonationService.setDriverTrackingStatus(donationId, 'Completed').catch(() => {});
  }

  /**
   * Check if tracking session is currently active
   */
  static isTracking(donationId: string): boolean {
    return activeSessions.has(donationId);
  }

  /**
   * Get active session coords
   */
  static getActiveCoords(donationId: string): { latitude: number; longitude: number } | null {
    const session = activeSessions.get(donationId);
    if (!session) return null;
    return { latitude: session.latitude, longitude: session.longitude };
  }
}

export default LiveTrackingService;
