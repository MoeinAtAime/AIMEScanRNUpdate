// // Fetching the user profile information API

import {fetchUserAttributes, updateUserAttribute} from 'aws-amplify/auth';

export class UserApiService {
  static async fetchAttributes() {
    console.log(
      '🚀 [USER API] Fetching user attributes from Cognito (no cache)...',
    );
    try {
      const start = Date.now();
      const attributes = await fetchUserAttributes();
      console.log(
        '✅ [USER API SUCCESS] Retrieved in',
        Date.now() - start,
        'ms',
      );
      return attributes;
    } catch (error) {
      console.error(
        '💥 [USER API ERROR] Failed to fetch user attributes:',
        error,
      );
      this.handleError(error);
      throw error;
    }
  }

  static async updateAttribute(key, value) {
    console.log('🔄 [USER UPDATE] Updating single attribute:', key);
    try {
      const start = Date.now();
      const result = await updateUserAttribute({
        userAttribute: {attributeKey: key, value: String(value)},
      });
      console.log(
        '✅ [USER UPDATE SUCCESS] Completed in',
        Date.now() - start,
        'ms',
      );
      return result;
    } catch (error) {
      console.error(
        '💥 [USER UPDATE ERROR] Failed to update attribute:',
        error,
      );
      this.handleError(error);
      throw error;
    }
  }

  static async updateAttributes(attrs) {
    console.log('🔄 [USER UPDATE] Bulk update (no cache)…');
    if (!attrs || typeof attrs !== 'object') {
      throw new Error(
        'updateAttributes requires a plain object of key/value pairs.',
      );
    }
    const entries = Object.entries(attrs).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== '',
    );
    if (!entries.length) return {updatedKeys: [], failures: []};

    const failures = [];
    const updatedKeys = [];
    for (const [key, rawValue] of entries) {
      try {
        await updateUserAttribute({
          userAttribute: {attributeKey: key, value: String(rawValue)},
        });
        updatedKeys.push(key);
      } catch (error) {
        console.error(`❌ [USER UPDATE ERROR] ${key}:`, error);
        failures.push({key, message: error?.message || String(error)});
      }
    }
    if (failures.length) {
      const msg = failures.map(f => `${f.key} (${f.message})`).join('; ');
      throw new Error(`Some attributes failed to update: ${msg}`);
    }
    console.log('✅ [USER UPDATE SUCCESS] Updated:', updatedKeys);
    return {updatedKeys, failures: []};
  }

  static async refreshUserAttributes() {
    // With no cache, refresh is just a fetch
    return await this.fetchAttributes();
  }

  static handleError(error) {
    if (error.code === 'NetworkError') {
      throw new Error(
        'Network connection issue. Please check your internet connection.',
      );
    }
    if (error.code === 'InvalidParameterException') {
      throw new Error(
        'Invalid input provided. Please check your data and try again.',
      );
    }
    throw error;
  }
}
