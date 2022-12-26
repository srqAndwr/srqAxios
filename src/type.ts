import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
//请求响应拦截器类型
export interface Interceptors {
  reqInterceptor?: {
    success?: (config: AxiosRequestConfig) => AxiosRequestConfig;
    fail?: (err: AxiosError) => any;
  };
  respInterceptor?: {
    success?: <T = AxiosResponse>(response: T) => T;
    fail?: (error: AxiosError) => any;
  };
}

export type RequestConfig<D> = AxiosRequestConfig<D> & Interceptors;

export interface CustomInitialInstanceConfig {
  cancelRequest?: boolean;
  instanceInterceptors?: Interceptors;
}
