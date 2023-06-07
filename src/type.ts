import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
//请求响应拦截器类型
export interface Interceptors {
  reqInterceptor?: {
    success?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    fail?: (err: AxiosError) => any;
  };
  respInterceptor?: {
    success?: <T = AxiosResponse>(response: T) => T;
    fail?: (error: AxiosError) => any;
  };
}

export type RequestConfig<D> = InternalAxiosRequestConfig<D> & Interceptors;

export interface CustomInitialInstanceConfig {
  cancelRequest?: boolean;
  instanceInterceptors?: Interceptors;
}
