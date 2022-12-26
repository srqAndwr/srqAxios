import { Md5 } from 'ts-md5';
export function md5(target: string) {
  return Md5.hashStr(target);
}
