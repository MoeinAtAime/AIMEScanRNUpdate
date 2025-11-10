// // // Fetching the user profile information API

///////////Update to include phone number normalization

// Fetching / updating the user profile information API
// app/api/userApi.js
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

  // --- Phone helpers (JS) ---
  static toE164(raw, defaultCountry = '+1') {
    if (!raw) return '';
    const digits = String(raw).replace(/[^\d+]/g, '');

    if (digits.startsWith('+')) return digits; // Already +<digits>
    if (defaultCountry === '+1' && /^\d{10}$/.test(digits))
      return `${defaultCountry}${digits}`;
    if (defaultCountry === '+1' && /^1\d{10}$/.test(digits))
      return `+${digits}`;
    return `${defaultCountry}${digits}`; // Fallback
  }

  /**
   * Optional phone update. Skips if empty. No verification step.
   * Ensure phone verification is disabled in Cognito User Pool if you don't want code prompts.
   */
  static async updatePhoneNumber(rawPhone, defaultCountry = '+1') {
    const value = (rawPhone || '').trim();
    if (!value) {
      console.log('ℹ️ [USER UPDATE] phone_number empty -> skipping');
      return {skipped: true};
    }
    const e164 = this.toE164(value, defaultCountry);

    console.log('🔄 [USER UPDATE] Updating single attribute: phone_number');
    try {
      const start = Date.now();
      const result = await updateUserAttribute({
        userAttribute: {attributeKey: 'phone_number', value: e164},
      });
      console.log(
        '✅ [USER UPDATE SUCCESS] phone_number in',
        Date.now() - start,
        'ms',
      );
      return result;
    } catch (error) {
      console.error(
        '💥 [USER UPDATE ERROR] Failed to update phone_number:',
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
        const message = error && error.message ? error.message : String(error); // ✅ JS-safe
        failures.push({key, message});
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
    return await this.fetchAttributes();
  }

  static handleError(error) {
    if (error && error.code === 'NetworkError') {
      throw new Error(
        'Network connection issue. Please check your internet connection.',
      );
    }
    if (error && error.code === 'InvalidParameterException') {
      throw new Error(
        'Invalid input provided. Please check your data and try again.',
      );
    }
    throw error;
  }
}
