
import LocalizedStrings from 'react-native-localization';
import en from './en.js';
import zh from './zh.js';

let strings = new LocalizedStrings({
 en,zh
});

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

