// // export {refreshLicenseKey, clearLicenseCache, getCacheStatus};

// // Fetching the License key with Cache (v10-safe)
// //
// // - Uses Internet Credentials API with server string for get/set
// // - Uses options object for reset: resetInternetCredentials({ server })
// // - Removes mixed/unused `{ service: ... }` options that caused warnings
// //
// // Docs (v10):
// // - getInternetCredentials(server, options?) -> UserCredentials|false
// // - setInternetCredentials(server, username, password, options?) -> Result|false
// // - resetInternetCredentials(options?) where options includes { server }
// //   (passing a raw string to reset is deprecated/removed)
// //
// // References:
// //   https://oblador.github.io/react-native-keychain/docs/api/functions/getInternetCredentials
// //   https://oblador.github.io/react-native-keychain/docs/api/functions/setInternetCredentials
// //   https://oblador.github.io/react-native-keychain/docs/api/functions/resetInternetCredentials

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {generateClient} from 'aws-amplify/api';
import {listSDKS} from '../../src/graphql/queries';

interface SDKItem {
  SDKLk?: string;
}

interface CacheMetadata {
  timestamp: number;
  expiresAt: number;
}

const DAYS_TO_MILLISECONDS = (days: number) => days * 24 * 60 * 60 * 1000;
const CACHE_METADATA_KEY = 'sdk_license_cache_metadata';
const KEYCHAIN_SERVER = 'SDKLicenseKey';
const CACHE_DURATION = DAYS_TO_MILLISECONDS(7); // 7 days in ms

/** =================== Cache metadata =================== */
const getCacheMetadata = async (): Promise<CacheMetadata | null> => {
  try {
    const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    if (!metadataStr) {
      console.log('📋 [CACHE] No cache metadata found');
      return null;
    }
    const metadata: CacheMetadata = JSON.parse(metadataStr);
    console.log('📋 [CACHE] Retrieved cache metadata:', {
      timestamp: new Date(metadata.timestamp).toISOString(),
      expiresAt: new Date(metadata.expiresAt).toISOString(),
      timeUntilExpiry:
        Math.round((metadata.expiresAt - Date.now()) / 1000 / 60) + ' minutes',
    });
    return metadata;
  } catch (error) {
    console.error('❌ [CACHE] Error reading cache metadata:', error);
    return null;
  }
};

/** =================== Read cached key =================== */
const getCachedLicenseKey = async (): Promise<string | null> => {
  try {
    console.log('🔍 [CACHE] Checking for cached license key...');

    const metadata = await getCacheMetadata();
    if (!metadata) {
      console.log('📋 [CACHE] No metadata found, cache miss');
      return null;
    }

    const now = Date.now();
    if (now > metadata.expiresAt) {
      console.log('⏰ [CACHE] Cache expired, removing stale data');
      await clearLicenseCache();
      return null;
    }

    const credentials = await Keychain.getInternetCredentials(KEYCHAIN_SERVER);

    if (credentials && credentials.password) {
      const timeRemaining = Math.round((metadata.expiresAt - now) / 1000 / 60);
      console.log('✅ [CACHE HIT] Using cached license key');
      console.log('⏱️  [CACHE] Time remaining:', timeRemaining, 'minutes');
      console.log(
        '📅 [CACHE] Cached at:',
        new Date(metadata.timestamp).toLocaleString(),
      );
      return credentials.password;
    } else {
      console.log('🔐 [CACHE] No license key found in Keychain, cache miss');
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      return null;
    }
  } catch (error) {
    console.error('❌ [CACHE] Error reading cached license key:', error);
    await clearLicenseCache();
    return null;
  }
};

/** =================== Write cached key =================== */
const cacheLicenseKey = async (licenseKey: string): Promise<void> => {
  try {
    console.log('💾 [CACHE] Storing license key securely...');

    const now = Date.now();
    const expiresAt = now + CACHE_DURATION;

    await Keychain.setInternetCredentials(
      KEYCHAIN_SERVER,
      'sdk_license', // username placeholder
      licenseKey,
    );

    // Store metadata in AsyncStorage
    const metadata: CacheMetadata = {timestamp: now, expiresAt};
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));

    console.log('✅ [CACHE] License key cached successfully');
    console.log('📅 [CACHE] Cached at:', new Date(now).toLocaleString());
    console.log('⏰ [CACHE] Expires at:', new Date(expiresAt).toLocaleString());
    console.log('🔐 [CACHE] Stored securely in device Keychain');
  } catch (error) {
    console.error('❌ [CACHE] Error caching license key:', error);
  }
};

/** =================== Fetch with cache =================== */
const fetchSDKLicenseKey = async (): Promise<string | null> => {
  console.log('🚀 [API] Starting license key retrieval...');

  // Try cache first
  const cachedKey = await getCachedLicenseKey();
  if (cachedKey) {
    console.log('🎯 [SUCCESS] Returning cached license key (no API call made)');
    return cachedKey;
  }

  // Cache miss → fetch via Amplify GraphQL
  console.log(
    '🌐 [API CALL] Cache miss - fetching fresh license key from DynamoDB...',
  );
  console.log('📡 [API CALL] Connecting to AWS Amplify backend...');

  const client = generateClient();

  try {
    const startTime = Date.now();

    const result = await client.graphql({
      query: listSDKS,
      authMode: 'userPool',
    });

    const apiCallDuration = Date.now() - startTime;
    console.log('📡 [API CALL] Response received in', apiCallDuration + 'ms');

    const sdkData = result?.data?.listSDKS?.items?.find(
      (item: SDKItem) => item.SDKLk !== undefined,
    );

    if (sdkData?.SDKLk) {
      console.log('✅ [API SUCCESS] License key retrieved from DynamoDB');
      console.log('💾 [API SUCCESS] Caching license key for next 7 days...');
      await cacheLicenseKey(sdkData.SDKLk);
      console.log('🎯 [SUCCESS] Fresh license key ready to use');
      return sdkData.SDKLk;
    } else {
      console.log('❌ [API ERROR] License key not found in DynamoDB response');
      return null;
    }
  } catch (error) {
    console.error('💥 [API ERROR] Failed to fetch license key:', error);
    throw error;
  }
};

/** =================== Force refresh =================== */
const refreshLicenseKey = async (): Promise<string | null> => {
  try {
    console.log('🔄 [REFRESH] Force refreshing license key...');
    await clearLicenseCache();
    const licenseKey = await fetchSDKLicenseKey();
    console.log('✅ [REFRESH] License key refreshed successfully');
    return licenseKey;
  } catch (error) {
    console.error('❌ [REFRESH] Error refreshing license key:', error);
    return null;
  }
};

/** =================== Clear cache =================== */
const clearLicenseCache = async (): Promise<void> => {
  try {
    console.log('🧹 [CLEANUP] Clearing license key cache...');

    await Keychain.resetInternetCredentials({server: KEYCHAIN_SERVER});

    await AsyncStorage.removeItem(CACHE_METADATA_KEY);

    console.log('✅ [CLEANUP] License key cache cleared completely');
  } catch (error) {
    console.error('❌ [CLEANUP] Error clearing cache:', error);
  }
};

/** =================== Debug status =================== */
const getCacheStatus = async (): Promise<{
  isCached: boolean;
  expiresAt?: Date;
  timeRemaining?: string;
}> => {
  try {
    const metadata = await getCacheMetadata();
    if (!metadata) return {isCached: false};

    const now = Date.now();
    if (now > metadata.expiresAt) return {isCached: false};

    const timeRemaining = Math.round((metadata.expiresAt - now) / 1000 / 60);
    return {
      isCached: true,
      expiresAt: new Date(metadata.expiresAt),
      timeRemaining: `${timeRemaining} minutes`,
    };
  } catch {
    return {isCached: false};
  }
};

export default fetchSDKLicenseKey;
export {refreshLicenseKey, clearLicenseCache, getCacheStatus};
