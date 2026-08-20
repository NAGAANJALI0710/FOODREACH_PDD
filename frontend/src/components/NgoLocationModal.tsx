import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Navigation, X, CheckCircle2, AlertCircle, Globe } from 'lucide-react-native';
import * as Location from 'expo-location';
import { AppTheme } from '../theme/theme';
import { RootState } from '../store';
import { updateProfile } from '../store/authSlice';
import { AuthService } from '../services/authService';
import { LocationService } from '../services/locationService';
import OSMMap from './OSMMap';

interface NgoLocationModalProps {
  visible: boolean;
  theme: AppTheme;
  onClose: () => void;
  onLocationSaved?: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
}

const DEFAULT_LAT = 28.6448; // Karol Bagh / New Delhi
const DEFAULT_LNG = 77.1903;

export const NgoLocationModal: React.FC<NgoLocationModalProps> = ({
  visible,
  theme,
  onClose,
  onLocationSaved,
  initialLat,
  initialLng,
  initialAddress,
}) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const existingLat = initialLat ?? user?.gpsLocation?.latitude ?? DEFAULT_LAT;
  const existingLng = initialLng ?? user?.gpsLocation?.longitude ?? DEFAULT_LNG;

  const [selectedLat, setSelectedLat] = useState<number>(existingLat);
  const [selectedLng, setSelectedLng] = useState<number>(existingLng);
  const [address, setAddress] = useState<string>(initialAddress || user?.address || '');

  const [locatingGps, setLocatingGps] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or user profile updates
  useEffect(() => {
    if (visible) {
      const lat = initialLat ?? user?.gpsLocation?.latitude ?? DEFAULT_LAT;
      const lng = initialLng ?? user?.gpsLocation?.longitude ?? DEFAULT_LNG;
      setSelectedLat(lat);
      setSelectedLng(lng);
      setAddress(initialAddress || user?.address || '');
      setNotice(null);
      setError(null);
    }
  }, [visible, initialLat, initialLng, initialAddress, user]);

  // Reverse geocode when coordinates change
  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setError(null);
    setNotice(null);
    setGeocoding(true);

    try {
      const formattedAddress = await LocationService.reverseGeocode(lat, lng);
      if (formattedAddress) {
        setAddress(formattedAddress);
      }
    } catch (_) {
    } finally {
      setGeocoding(false);
    }
  };

  // Option 1: Use Current Location (GPS)
  const handleUseCurrentLocation = async () => {
    setLocatingGps(true);
    setError(null);
    setNotice(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNotice('GPS Permission denied. You can still select your location manually on the map below.');
        setLocatingGps(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setSelectedLat(lat);
      setSelectedLng(lng);

      setGeocoding(true);
      const formattedAddress = await LocationService.reverseGeocode(lat, lng);
      if (formattedAddress) {
        setAddress(formattedAddress);
      }
      setNotice('⚡ Successfully updated to your current GPS position!');
    } catch (err: any) {
      console.warn('GPS location error:', err);
      setNotice('Could not retrieve GPS coordinates. Please select location manually on the map.');
    } finally {
      setLocatingGps(false);
      setGeocoding(false);
    }
  };

  // Option 2: Geocode entered text address
  const handleSearchAddress = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    setError(null);
    try {
      const coords = await LocationService.geocodeAddress(address);
      if (coords) {
        setSelectedLat(coords.latitude);
        setSelectedLng(coords.longitude);
        setNotice('📍 Map centered on searched address.');
      } else {
        setError('Could not locate address. Tap directly on the map to place your pin.');
      }
    } catch (err) {
      setError('Geocoding error. Tap on the map to pick location.');
    } finally {
      setGeocoding(false);
    }
  };

  // Option 3: Save Location & Update Profile
  const handleConfirmLocation = async () => {
    if (selectedLat == null || selectedLng == null || isNaN(selectedLat) || isNaN(selectedLng)) {
      setError('Please select a valid location on the map before confirming.');
      return;
    }

    setSaving(true);
    setError(null);

    const updatePayload = {
      address: address.trim() || `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`,
      latitude: selectedLat,
      longitude: selectedLng,
      gpsLocation: { latitude: selectedLat, longitude: selectedLng },
    };

    try {
      await AuthService.updateProfile(updatePayload);
      dispatch(updateProfile(updatePayload));

      if (onLocationSaved) {
        onLocationSaved();
      }
      onClose();
    } catch (err: any) {
      console.error('Save NGO location error:', err);
      // Fallback: save to Redux store locally
      dispatch(updateProfile(updatePayload));
      if (onLocationSaved) {
        onLocationSaved();
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isValidLocation = Boolean(selectedLat != null && selectedLng != null && !isNaN(selectedLat) && !isNaN(selectedLng));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: theme.colors.text }]}>NGO Location Setup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} id="btn-close-ngo-loc-modal">
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Notice / Warning Banners */}
            {notice && (
              <View style={[styles.banner, { backgroundColor: theme.colors.primary + '18', borderColor: theme.colors.primary + '40' }]}>
                <AlertCircle size={15} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.bannerText, { color: theme.colors.primary }]}>{notice}</Text>
              </View>
            )}
            {error && (
              <View style={[styles.banner, { backgroundColor: theme.colors.error + '18', borderColor: theme.colors.error + '40' }]}>
                <AlertCircle size={15} color={theme.colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.bannerText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            )}

            {/* Quick Action Options */}
            <View style={styles.optionsRow}>
              {/* Option 1: Use Current Location */}
              <TouchableOpacity
                id="btn-use-current-location"
                style={[styles.optionBtn, { backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary + '40' }]}
                onPress={handleUseCurrentLocation}
                disabled={locatingGps}
              >
                {locatingGps ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <Navigation size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.optionBtnText, { color: theme.colors.primary }]}>Use Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Option 2: Select Location on Map (Interactive badge hint) */}
              <View style={[styles.optionBadge, { backgroundColor: theme.colors.surface }]}>
                <Globe size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.optionBadgeText, { color: theme.colors.textSecondary }]}>📍 Select Location on Map</Text>
              </View>
            </View>

            {/* Address Search / Input */}
            <View style={styles.addressWrapper}>
              <TextInput
                id="input-ngo-location-address"
                style={[styles.addressInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="Enter or search full NGO office address..."
                placeholderTextColor={theme.colors.textSecondary}
                value={address}
                onChangeText={setAddress}
                onBlur={handleSearchAddress}
              />
            </View>

            {/* Interactive Map */}
            <View style={styles.mapContainer}>
              <OSMMap
                theme={theme}
                latitude={selectedLat}
                longitude={selectedLng}
                zoom={14}
                height={260}
                interactive={true}
                onLocationSelect={handleLocationSelect}
                markers={[
                  {
                    latitude: selectedLat,
                    longitude: selectedLng,
                    label: 'NGO Office Location',
                    color: theme.colors.primary,
                  },
                ]}
              />
            </View>

            {/* Coordinates & Status Badge */}
            <View style={[styles.coordsBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.coordsLabel, { color: theme.colors.textSecondary }]}>Selected Coordinates:</Text>
                <Text style={[styles.coordsVal, { color: theme.colors.text }]}>
                  Latitude: {selectedLat.toFixed(5)}, Longitude: {selectedLng.toFixed(5)}
                </Text>
              </View>
              {geocoding && <ActivityIndicator size="small" color={theme.colors.primary} />}
            </View>

            {/* Confirm Location Button */}
            <TouchableOpacity
              id="btn-confirm-ngo-location"
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: isValidLocation ? theme.colors.primary : theme.colors.border,
                  opacity: isValidLocation && !saving ? 1 : 0.6,
                },
              ]}
              onPress={handleConfirmLocation}
              disabled={!isValidLocation || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmBtnText}>Confirm NGO Location</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'System',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'System',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  addressWrapper: {
    marginBottom: 12,
  },
  addressInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: 'System',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  coordsLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  coordsVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'System',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'System',
  },
});

export default NgoLocationModal;
