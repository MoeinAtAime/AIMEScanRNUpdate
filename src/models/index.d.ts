import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerSDK = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SDK, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly SDKLk?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazySDK = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SDK, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly SDKLk?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type SDK = LazyLoading extends LazyLoadingDisabled ? EagerSDK : LazySDK

export declare const SDK: (new (init: ModelInit<SDK>) => SDK) & {
  copyOf(source: SDK, mutator: (draft: MutableModel<SDK>) => MutableModel<SDK> | void): SDK;
}

type EagerUserData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserData, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly email?: string | null;
  readonly activationID?: string | null;
  readonly timeStamp?: string | null;
  readonly PULSE_RATE?: string | null;
  readonly PULSE_RATE_CONF_LEVEL?: string | null;
  readonly BLOOD_PRESSURE?: string | null;
  readonly HEMOGLOBIN?: string | null;
  readonly LF_HF?: string | null;
  readonly OXYGEN_SATURATION?: string | null;
  readonly STRESS_LEVEL?: string | null;
  readonly WELLNESS_INDEX?: string | null;
  readonly userIPAdd?: string | null;
  readonly userDeviceInfo?: string | null;
  readonly userDeviceInfoVersion?: string | null;
  readonly SDNN?: string | null;
  readonly SDNN_CONF_LEVEL?: string | null;
  readonly MEAN_RRI?: string | null;
  readonly MEAN_RRI_CONF_LEVEL?: string | null;
  readonly RESPIRATION_RATE?: string | null;
  readonly RESPIRATION_RATE_CONF_LEVEL?: string | null;
  readonly PRQ?: string | null;
  readonly PRQ_CONF_LEVEL?: string | null;
  readonly RRI?: string | null;
  readonly RRI_CONF_LEVEL?: string | null;
  readonly HEMOGLOBIN_A1C?: string | null;
  readonly PNS_INDEX?: string | null;
  readonly PNS_ZONE?: string | null;
  readonly RMSSD?: string | null;
  readonly SD1?: string | null;
  readonly SD2?: string | null;
  readonly SNS_INDEX?: string | null;
  readonly SNS_ZONE?: string | null;
  readonly STRESS_INDEX?: string | null;
  readonly WELLNESS_LEVEL?: string | null;
  readonly ASCVD_RISK?: string | null;
  readonly HEART_AGE?: string | null;
  readonly HIGH_BLOOD_PRESSURE_RISK?: string | null;
  readonly HIGH_FASTING_GLUCOSE_RISK?: string | null;
  readonly HIGH_HEMOGLOBIN_A1C_RISK?: string | null;
  readonly HIGH_TOTAL_CHOLESTEROL_RISK?: string | null;
  readonly LOW_HEMOGLOBIN_RISK?: string | null;
  readonly NORMALIZED_STRESS_INDEX?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserData, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly email?: string | null;
  readonly activationID?: string | null;
  readonly timeStamp?: string | null;
  readonly PULSE_RATE?: string | null;
  readonly PULSE_RATE_CONF_LEVEL?: string | null;
  readonly BLOOD_PRESSURE?: string | null;
  readonly HEMOGLOBIN?: string | null;
  readonly LF_HF?: string | null;
  readonly OXYGEN_SATURATION?: string | null;
  readonly STRESS_LEVEL?: string | null;
  readonly WELLNESS_INDEX?: string | null;
  readonly userIPAdd?: string | null;
  readonly userDeviceInfo?: string | null;
  readonly userDeviceInfoVersion?: string | null;
  readonly SDNN?: string | null;
  readonly SDNN_CONF_LEVEL?: string | null;
  readonly MEAN_RRI?: string | null;
  readonly MEAN_RRI_CONF_LEVEL?: string | null;
  readonly RESPIRATION_RATE?: string | null;
  readonly RESPIRATION_RATE_CONF_LEVEL?: string | null;
  readonly PRQ?: string | null;
  readonly PRQ_CONF_LEVEL?: string | null;
  readonly RRI?: string | null;
  readonly RRI_CONF_LEVEL?: string | null;
  readonly HEMOGLOBIN_A1C?: string | null;
  readonly PNS_INDEX?: string | null;
  readonly PNS_ZONE?: string | null;
  readonly RMSSD?: string | null;
  readonly SD1?: string | null;
  readonly SD2?: string | null;
  readonly SNS_INDEX?: string | null;
  readonly SNS_ZONE?: string | null;
  readonly STRESS_INDEX?: string | null;
  readonly WELLNESS_LEVEL?: string | null;
  readonly ASCVD_RISK?: string | null;
  readonly HEART_AGE?: string | null;
  readonly HIGH_BLOOD_PRESSURE_RISK?: string | null;
  readonly HIGH_FASTING_GLUCOSE_RISK?: string | null;
  readonly HIGH_HEMOGLOBIN_A1C_RISK?: string | null;
  readonly HIGH_TOTAL_CHOLESTEROL_RISK?: string | null;
  readonly LOW_HEMOGLOBIN_RISK?: string | null;
  readonly NORMALIZED_STRESS_INDEX?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserData = LazyLoading extends LazyLoadingDisabled ? EagerUserData : LazyUserData

export declare const UserData: (new (init: ModelInit<UserData>) => UserData) & {
  copyOf(source: UserData, mutator: (draft: MutableModel<UserData>) => MutableModel<UserData> | void): UserData;
}