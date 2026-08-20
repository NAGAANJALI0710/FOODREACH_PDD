/**
 * Application Feature Flags Configuration
 */
export const FEATURE_FLAGS = {
  /**
   * Controls visibility of Live Tracking UI components across Donor and NGO dashboards & detail screens.
   * - Set to `false` to temporarily hide live tracking banners, volunteer tracking cards, live map buttons, and ETA labels.
   * - Set to `true` to display live tracking UI elements.
   * - NOTE: All underlying backend APIs, Supabase realtime channels, and location services remain 100% active.
   */
  SHOW_LIVE_TRACKING_UI: false,
};

export const SHOW_LIVE_TRACKING_UI = FEATURE_FLAGS.SHOW_LIVE_TRACKING_UI;
export default FEATURE_FLAGS;
