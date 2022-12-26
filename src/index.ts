/*
 * @Author: shiruiqiang
 * @Date: 2022-12-26 10:59:14
 * @LastEditTime: 2022-12-26 11:02:00
 * @LastEditors: shiruiqiang
 * @FilePath: index.ts
 * @Description:
 */
import Request from './core';

export default Request;
export { handleNetworkError } from './error-handle';
export { md5 } from './utils';
export type {
  Interceptors,
  RequestConfig,
  CustomInitialInstanceConfig
} from './type';
