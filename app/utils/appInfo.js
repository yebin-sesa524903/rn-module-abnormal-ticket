'use strict';

import { NativeModules } from 'react-native';
import storage from "./storage";
const AGREED_USER_ACTION_ANALYSE = 'AGREED_USER_ACTION_ANALYSE';

var _cached = null;

var getInfo = async () => {
  var {versionName,packageName,ossBucket,prod,upgradeUri,gaodeKey,gaodeSDKKey,privacyEntryUri,privacyMyUri,exchangeUri} = await NativeModules.REMAppInfo.getAppInfo();
  // console.warn('appInfo',gaodeKey,versionName,packageName,ossBucket,prod);
  _cached = {versionName,packageName,ossBucket,prod,upgradeUri,gaodeKey,gaodeSDKKey,privacyEntryUri,privacyMyUri,exchangeUri};
  // console.warn('info',_cached);
};

getInfo();

//console.warn('cachedAppInfo',cachedAppInfo);

/*
 {
   versionName
   packageName
   ossBucket
   prod
 }
*/


export default {
  get(){
    return _cached;
  },
  isTraceEnabled(){
    return storage.getItem(AGREED_USER_ACTION_ANALYSE);
  },
  enableTrace(enable) {
    NativeModules.REMAppInfo.enableTrace(String(enable))
    storage.setItem(AGREED_USER_ACTION_ANALYSE,String(enable));
  }
};
