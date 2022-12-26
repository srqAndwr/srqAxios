/*
 * @Author: shiruiqiang
 * @Date: 2022-10-13 17:47:43
 * @LastEditTime: 2022-11-28 22:35:33
 * @LastEditors: shiruiqiang
 * @FilePath: core.ts
 * @Description:
 */
import axios from 'axios';
import {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  Canceler
} from 'axios';
import type { RequestConfig, CustomInitialInstanceConfig } from './type';
import { handleNetworkError } from './error-handle';
import { md5 } from './utils';

class Request {
  //当前axios实例
  private _instance: AxiosInstance;
  //当前实例请求拦截器返回值
  private _requestInterceptor?: number;
  //当前实例响应拦截器返回值
  private _responseInterceptor?: number;
  // 请求池
  private _pendingRequest: Map<string, Canceler>;
  private static _cancelToken = axios.CancelToken;
  // 是否取消重复请求
  private _isCancelRequest = true;
  /**
   *
   * @param config 在实例化某一Request时确定的一些配置，例如：BaseUrl,Headers,Proxy之类
   * @param customConfig 自定义配置
   */
  constructor(
    config: AxiosRequestConfig,
    customConfig?: CustomInitialInstanceConfig
  ) {
    this._instance = axios.create({
      ...config
    });
    this._pendingRequest = new Map();
    this._isCancelRequest =
      customConfig?.cancelRequest ?? this._isCancelRequest;
    /**
     * 全局请求拦截器
     */
    this._instance.interceptors.request.use(
      (config) => {
        //全局请求成功拦截器
        // console.log('Global Request Success Interceptor');
        if (this._isCancelRequest) {
          // 判断该请求是否重复，并与之取消和删除
          this._removeRequestFromPending(config);
          // 将本次请求放入请求池
          this._addRequestToPending(config);
        }
        return config;
      },
      (err: unknown) => {
        // 全局请求失败拦截器
        // console.log('Global Request Fail Interceptor');
        return err;
      }
    );
    /**
     * 全局响应拦截器
     */
    this._instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // 全局响应成功拦截器
        // console.log('Global Response Success Interceptor');
        if (this._isCancelRequest) {
          // 将响应以后的请求从请求池中删除
          this._removeRequestFromPending(res.config);
        }
        return res.data;
      },
      (err: unknown) => {
        //全局响应错误拦截器
        // console.log('Global Response Fail Interceptor');
        if (this._isCancelRequest) {
          // 将响应以后的请求从请求池中删除
          this._removeRequestFromPending((err as AxiosError)?.config || {});
        }
        // 取消请求后的错误
        if (axios.isCancel(err)) {
          console.log('Request canceled：', err.message);
        } else {
          // 网络错误处理
          console.log(handleNetworkError(err as AxiosError));
        }
        return Promise.reject(err);
      }
    );
    /**
     * 实例自定义请求拦截器
     */
    customConfig?.instanceInterceptors?.reqInterceptor &&
      (this._requestInterceptor = this._instance.interceptors.request.use(
        customConfig?.instanceInterceptors?.reqInterceptor?.success,
        customConfig?.instanceInterceptors?.reqInterceptor?.fail
      ));
    /**
     * 实例自定义响应拦截器
     */
    customConfig?.instanceInterceptors?.respInterceptor &&
      (this._responseInterceptor = this._instance.interceptors.response.use(
        customConfig?.instanceInterceptors?.respInterceptor?.success,
        customConfig?.instanceInterceptors?.respInterceptor?.fail
      ));
  }
  private _request<D = any, T = any>(config: RequestConfig<D>) {
    return new Promise<T>((resolve, reject) => {
      const reqInterceptor = config?.reqInterceptor;
      const respInterceptor = config?.respInterceptor;
      if (reqInterceptor?.success) {
        config = reqInterceptor.success(config);
      }
      try {
        this._instance
          .request<D, T>(config)
          .then((res) => {
            if (respInterceptor?.success) {
              respInterceptor.success(res);
            }
            resolve(res);
          })
          .catch((e: AxiosError) => {
            if (reqInterceptor?.fail) {
              reqInterceptor.fail(e);
            }
            reject(e);
          });
      } catch (error) {
        if (reqInterceptor?.fail) {
          reqInterceptor.fail(error as unknown as AxiosError);
        }
      }
    });
  }
  private _get<D = any, T = any>(config: Omit<RequestConfig<D>, 'method'>) {
    return this._request<D, T>({
      ...config,
      method: 'GET'
    });
  }
  private _post<D = any, T = any>(config: Omit<RequestConfig<D>, 'method'>) {
    return this._request<D, T>({
      ...config,
      method: 'POST'
    });
  }
  private _delete<D = any, T = any>(config: Omit<RequestConfig<D>, 'method'>) {
    return this._request<D, T>({
      ...config,
      method: 'DELETE'
    });
  }
  private _addRequestToPending(config: AxiosRequestConfig) {
    const key = this._generateReqKey({
      url: config.url,
      params: config.params,
      data: config.data
    });
    if (!this._pendingRequest.has(key)) {
      config.cancelToken = new Request._cancelToken((c) => {
        this._pendingRequest.set(this._generateReqKey(config), c);
      });
    }
  }
  /**
   * 根据url,params,data生产key
   * @param config url,params,data
   * @returns
   */
  private _generateReqKey(
    config: Pick<AxiosRequestConfig, 'url' | 'params' | 'data'>
  ) {
    const { url, params, data } = config;
    const target = [url, JSON.stringify(params), JSON.stringify(data)].join(
      '&'
    );
    return md5(target);
  }
  // 将指定请求从请求池中删除
  private _removeRequestFromPending(config: AxiosRequestConfig) {
    const key = this._generateReqKey({
      url: config.url,
      params: config.params,
      data: config.data
    });
    if (this._pendingRequest.has(key)) {
      const targetCancel = this._pendingRequest.get(key);
      if (targetCancel) targetCancel('repeat request');
      this._pendingRequest.delete(key);
    }
  }
  //取消拦截器
  private _cancelIntercept() {
    this._requestInterceptor &&
      this._instance.interceptors.request.eject(this._requestInterceptor);
    this._responseInterceptor &&
      this._instance.interceptors.response.eject(this._responseInterceptor);
  }
  /**
   * 取消请求
   * @param key 请求标识，格式为md5([url, JSON.stringify(params), JSON.stringify(data)].join('&'))
   * @param massage 取消提示信息
   */
  cancelRequest(
    config: Pick<AxiosRequestConfig, 'url' | 'params' | 'data'>,
    massage?: string
  ) {
    const targetCancel = this._pendingRequest.get(this._generateReqKey(config));
    if (targetCancel) targetCancel(massage);
  }

  get request() {
    return this._request;
  }
  get get() {
    return this._get;
  }
  get post() {
    return this._post;
  }
  get delete() {
    return this._delete;
  }
  /**
   * 取消实例自定义拦截器
   */
  get cancelIntercept() {
    return this._cancelIntercept;
  }
}

export default Request;
