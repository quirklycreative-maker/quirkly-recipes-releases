import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

const UPDATE_URL = 'https://quirkly.life/app-update.json';

interface UpdateConfig {
  latest_app_version: string;
  latest_apk_url?: string;
  url?: string;
}

// Simple semver compare (e.g. 1.0.1 > 1.0.0)
const isNewerVersion = (latest: string, current: string) => {
  const lParts = latest.split('.').map(Number);
  const cParts = current.split('.').map(Number);
  
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const checkForUpdates = async () => {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    
    // Fetch the raw JSON configuration from the generic URL
    const response = await fetch(UPDATE_URL, {
      headers: {
        'Cache-Control': 'no-cache', // Ensure we get the latest
      }
    });
    
    if (!response.ok) return;
    
    const config: UpdateConfig = await response.json();
    
    const downloadUrl = config.url || config.latest_apk_url;
    
    if (config.latest_app_version && downloadUrl) {
      if (isNewerVersion(config.latest_app_version, currentVersion)) {
        Alert.alert(
          "Update Available!",
          `A new version of Quirkly (${config.latest_app_version}) is available. Do you want to download it now?`,
          [
            { text: "Later", style: "cancel" },
            { 
              text: "Download", 
              onPress: () => {
                Linking.openURL(downloadUrl).catch((err) => {
                  console.error("Failed to open update URL:", err);
                  Alert.alert("Error", "Could not open download link.");
                });
              }
            }
          ],
          { cancelable: true }
        );
      }
    }
  } catch (error) {
    console.warn('Failed to check for updates:', error);
  }
};
