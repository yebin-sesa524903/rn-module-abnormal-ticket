
import LocalizedStrings from 'react-native-localization';
import en from './en.js';
import zh from './zh.js';

import storage from "../storage";
import {DeviceEventEmitter} from "react-native";

const KEY = "lang_setting";
const KEY_LANGUAGE_CHANGE = 'language_changed';
export const SupportLanguage = {
  zh:'zh',
  en:'en',
  auto:''
}

let strings = new LocalizedStrings({
  zh,en
});

DeviceEventEmitter.addListener(KEY_LANGUAGE_CHANGE,(lan)=>{
  configLanguage(lan)
  storage.setItem(KEY,lan).then()
})

function configLanguage(lan) {
  switch (lan){
    case SupportLanguage.zh:
      strings = new LocalizedStrings({
        zh
      });
      break;
    case SupportLanguage.en:
      strings = new LocalizedStrings({
        en
      });
      break;
    case null:
    case undefined:
    case SupportLanguage.auto:
      strings = new LocalizedStrings({
        en,zh
      });
      break;
  }
}

//这里应该是根据配置文件来加载
// storage.getItem(KEY).then((lan)=>{
//   configLanguage(lan)
// })

export function localStr(key)
{
  var value=strings[key];
  if (value===undefined) {
    return key;
  }
  return strings[key];
}

export function localFormatStr(key,...values)
{
  return strings.formatString(strings[key],...values);
}

export function getLanguage() {
  return strings.getLanguage();
}

export function getInterfaceLanguage() {
  return strings.getInterfaceLanguage();
}

