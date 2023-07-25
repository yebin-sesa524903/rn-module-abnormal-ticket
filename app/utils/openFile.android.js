'use strict';

const FileOpener = require('react-native-file-opener');

export function openFile(filePath,type,cbOpenFailed){
    console.warn('start open on android');
    // if (type==='ini'||type==='exe'||type==='rar'||type==='zip') {
    //   cbOpenFailed();
    //   return;
    // }
    type=type.toLowerCase();
    var mime='application/msword';
    if (type==='jpg'||type==='png'||type==='gif') {
      mime='image/jpeg';
    }else if (type==='pdf') {
      mime='application/msword';
    }else if (type==='doc'||type==='xls'||type==='ppt') {
      mime='application/msword';
    }
    FileOpener.open(filePath,mime).then(() => {
        console.log('success!!');
    },(e) => {
      cbOpenFailed();
    });
}
