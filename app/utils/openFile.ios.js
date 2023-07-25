'use strict';

import OpenFileIOS from 'react-native-open-file';

export function openFile(filePath,type,cbOpenFailed){
  if (type==='ini'||type==='exe') {
    cbOpenFailed();
  }else {
    OpenFileIOS.open(filePath);
  }
}
