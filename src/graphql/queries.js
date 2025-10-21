/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSDK = /* GraphQL */ `
  query GetSDK($id: ID!) {
    getSDK(id: $id) {
      id
      SDKLk
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const listSDKS = /* GraphQL */ `
  query ListSDKS(
    $filter: ModelSDKFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSDKS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        SDKLk
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncSDKS = /* GraphQL */ `
  query SyncSDKS(
    $filter: ModelSDKFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSDKS(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        SDKLk
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getUserData = /* GraphQL */ `
  query GetUserData($id: ID!) {
    getUserData(id: $id) {
      id
      email
      activationID
      timeStamp
      PULSE_RATE
      PULSE_RATE_CONF_LEVEL
      BLOOD_PRESSURE
      HEMOGLOBIN
      LF_HF
      OXYGEN_SATURATION
      STRESS_LEVEL
      WELLNESS_INDEX
      userIPAdd
      userDeviceInfo
      userDeviceInfoVersion
      SDNN
      SDNN_CONF_LEVEL
      MEAN_RRI
      MEAN_RRI_CONF_LEVEL
      RESPIRATION_RATE
      RESPIRATION_RATE_CONF_LEVEL
      PRQ
      PRQ_CONF_LEVEL
      RRI
      RRI_CONF_LEVEL
      HEMOGLOBIN_A1C
      PNS_INDEX
      PNS_ZONE
      RMSSD
      SD1
      SD2
      SNS_INDEX
      SNS_ZONE
      STRESS_INDEX
      WELLNESS_LEVEL
      ASCVD_RISK
      HEART_AGE
      HIGH_BLOOD_PRESSURE_RISK
      HIGH_FASTING_GLUCOSE_RISK
      HIGH_HEMOGLOBIN_A1C_RISK
      HIGH_TOTAL_CHOLESTEROL_RISK
      LOW_HEMOGLOBIN_RISK
      NORMALIZED_STRESS_INDEX
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const listUserData = /* GraphQL */ `
  query ListUserData(
    $filter: ModelUserDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        email
        activationID
        timeStamp
        PULSE_RATE
        PULSE_RATE_CONF_LEVEL
        BLOOD_PRESSURE
        HEMOGLOBIN
        LF_HF
        OXYGEN_SATURATION
        STRESS_LEVEL
        WELLNESS_INDEX
        userIPAdd
        userDeviceInfo
        userDeviceInfoVersion
        SDNN
        SDNN_CONF_LEVEL
        MEAN_RRI
        MEAN_RRI_CONF_LEVEL
        RESPIRATION_RATE
        RESPIRATION_RATE_CONF_LEVEL
        PRQ
        PRQ_CONF_LEVEL
        RRI
        RRI_CONF_LEVEL
        HEMOGLOBIN_A1C
        PNS_INDEX
        PNS_ZONE
        RMSSD
        SD1
        SD2
        SNS_INDEX
        SNS_ZONE
        STRESS_INDEX
        WELLNESS_LEVEL
        ASCVD_RISK
        HEART_AGE
        HIGH_BLOOD_PRESSURE_RISK
        HIGH_FASTING_GLUCOSE_RISK
        HIGH_HEMOGLOBIN_A1C_RISK
        HIGH_TOTAL_CHOLESTEROL_RISK
        LOW_HEMOGLOBIN_RISK
        NORMALIZED_STRESS_INDEX
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncUserData = /* GraphQL */ `
  query SyncUserData(
    $filter: ModelUserDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        email
        activationID
        timeStamp
        PULSE_RATE
        PULSE_RATE_CONF_LEVEL
        BLOOD_PRESSURE
        HEMOGLOBIN
        LF_HF
        OXYGEN_SATURATION
        STRESS_LEVEL
        WELLNESS_INDEX
        userIPAdd
        userDeviceInfo
        userDeviceInfoVersion
        SDNN
        SDNN_CONF_LEVEL
        MEAN_RRI
        MEAN_RRI_CONF_LEVEL
        RESPIRATION_RATE
        RESPIRATION_RATE_CONF_LEVEL
        PRQ
        PRQ_CONF_LEVEL
        RRI
        RRI_CONF_LEVEL
        HEMOGLOBIN_A1C
        PNS_INDEX
        PNS_ZONE
        RMSSD
        SD1
        SD2
        SNS_INDEX
        SNS_ZONE
        STRESS_INDEX
        WELLNESS_LEVEL
        ASCVD_RISK
        HEART_AGE
        HIGH_BLOOD_PRESSURE_RISK
        HIGH_FASTING_GLUCOSE_RISK
        HIGH_HEMOGLOBIN_A1C_RISK
        HIGH_TOTAL_CHOLESTEROL_RISK
        LOW_HEMOGLOBIN_RISK
        NORMALIZED_STRESS_INDEX
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
