export type ApiEnvName = 'development' | 'sit' | 'uat' | 'production';

export interface ApiEnvironmentConfig {
  label: string;
  apiBaseUrl: string;
}

export const API_ENVIRONMENTS: Record<ApiEnvName, ApiEnvironmentConfig> = {
  development: {
    label: 'Development (local)',
    apiBaseUrl: 'http://localhost:8080/api/v1',
  },
  sit: {
    label: 'SIT',
    apiBaseUrl: 'https://sit-api.caissier.app/api/v1',
  },
  uat: {
    label: 'UAT',
    apiBaseUrl: 'https://uat-api.caissier.app/api/v1',
  },
  production: {
    label: 'Production',
    apiBaseUrl: 'https://api.caissier.app/api/v1',
  },
};

export const API_ENV_NAMES = Object.keys(API_ENVIRONMENTS) as ApiEnvName[];

export const DEFAULT_API_ENV: ApiEnvName = 'development';

export function isApiEnvName(value: string | undefined | null): value is ApiEnvName {
  return !!value && (API_ENV_NAMES as string[]).includes(value);
}
