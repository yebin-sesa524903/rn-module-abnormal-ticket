'use strict';

import {Clipboard} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import RNSecureKeyStore, {ACCESSIBLE} from "react-native-secure-key-store";
var CryptoJS = require("crypto-js");
var ENCKEYVERSION = 'ENCRYPTKEY';

var TOKENKEY = "TOKENKEY";
var NAMEKEY = 'USERNAMEKEY';
var DEVICEKEY = 'DEVICEKEY';
var USERINFO = 'USERINFO';

var tempToken = null;
var tempName = null;

var tempDeviceid = null;

function createUuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
}

export default {
  encodeId(id){
		var n = Number(id);
		return n.toString(16);
	},
	decodeId(str){
		return parseInt(str,16);
	},
  setToken(tokenValue,isDemoUser){
    // console.log('tokenValue:'+tokenValue);
    if(isDemoUser){
      tempToken = tokenValue;
    }
    else {
      return this.setItem(TOKENKEY,tokenValue);
    }
  },
  async removeItem(key){
    let ret = await this.getItem(key)
    if (ret) {
      RNSecureKeyStore.remove(key);
    }
  },
  removeToken(){
    tempToken = null;
    this.removeItem(TOKENKEY);
  },
  async getToken(cb){
    if(tempToken){
      return tempToken;
    }
    //return this.getItem(TOKENKEY,cb);
    let strValue = await this.getItem(TOKENKEY,cb);
    return strValue;
  },
  async getIsEncryptData(){
    // let isEnc = await this.getItem(ENCKEYVERSION,null,null);
    // return isEnc;
    // return '1000';
    return false;
  },
  initEncVersion(){
    this.setItem(ENCKEYVERSION,'1000');
  },
  getIsDemoToken()
  {
    return tempToken?true:false;
  },
  getName(cb)
  {
    if(tempName){
      return tempName;
    }
    return this.getItem(NAMEKEY,cb);
  },
  setName(value){
    return this.setItem(NAMEKEY,value);
  },
  removeName(){
    this.removeItem(NAMEKEY);
  },

  setUser(user){
    return this.setItem(USERINFO,user);
  },
  async getUser(cb){
    await this.getItem(USERINFO,cb);
  },

  async getDeviceId(cb)
  {
    if(tempDeviceid){
      return tempDeviceid;
    }
    tempDeviceid = await this.getItem(DEVICEKEY,cb);
    if (!tempDeviceid) {
      tempDeviceid=createUuid(32,16);
    }
    this.setItem(DEVICEKEY,tempDeviceid);
    return tempDeviceid;
  },
  removeDeviceId(){
    tempDeviceid=null;
    this.removeItem(DEVICEKEY);
  },
  // removeItem(key){
  //   // AsyncStorage.removeItem(key);
  //   RNSecureKeyStore.remove(key)
  // },
  async setItem(key,value){
    // let isEncVer = await this.getIsEncryptData();
    // console.warn('setItem--------',isEncVer);
    let encValue = value;
    // if (isEncVer==='1000') {
    //   encValue = CryptoJS.AES.encrypt(value, 'P@ssw0rd').toString();
    // }
    // return AsyncStorage.setItem(key, encValue);
    return RNSecureKeyStore.set(key, encValue, {accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY})
  },
  async getItem(key,cb,isAutoEnc){
    // let isEncVer = await this.getIsEncryptData();
    // console.warn('111',key,isAutoEnc);
    return new Promise((res,rej)=>{
      // console.warn('222',key,isAutoEnc);
      RNSecureKeyStore.get(key).then((ret)=>{
        cb && cb(ret);
        return res(ret);
      },(err) => {
        return res(null,err);
      });
      // AsyncStorage.getItem(key,(err,ret)=>{
      //   cb && cb(ret,err);
      //   return res(ret);
      // });
    })
  },
  async getClipboardContent(cb){
    // console.log('getClipboardContent');
    // console.log(Clipboard);
    var content = await Clipboard.getString();
    // console.warn('clipboard content:',content);
    cb.call(null,content);
  },
  emptyClipboardContent(){
    Clipboard.setString('');
  },
};
