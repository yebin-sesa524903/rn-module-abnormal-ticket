import Permissions,{PERMISSIONS,check,RESULTS,request} from 'react-native-permissions';
import { PermissionsAndroid,Alert,InteractionManager,Platform } from 'react-native';
import SndAlert from "../../../../app/utils/components/SndAlert";

function requestExternalStorageAccess(cb,failCallback) {
	try {
		PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
		).then((granted)=>{
			if (granted === PermissionsAndroid.RESULTS.GRANTED) {
				if(cb) cb();
			} else {
				SndAlert.alert(
					'',
					'请在手机的'+'"'+'设置'+'"'+'中，允许千里眼访问您的存储',
					[
						{text: '取消', onPress: () => {
							if(failCallback) failCallback();
							}},
						{text: '允许', onPress: () => {
								if(failCallback) failCallback();
								if (Permissions.openSettings()) {
									Permissions.openSettings();
								}
							}}
					],
					{ cancelable: false }
				)
			}
		});
	} catch (err) {
		console.warn(err);
	}
}

function requestIOSPhotosAccess(cb,failCallback) {
  check(PERMISSIONS.IOS.PHOTO_LIBRARY).then(response => {
    if (response === RESULTS.GRANTED || response === RESULTS.LIMITED) {
      InteractionManager.runAfterInteractions(() => {
        if(cb) cb();
      });
    } else {
      request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(response => {
        if (response === RESULTS.GRANTED || response === RESULTS.LIMITED) {
          InteractionManager.runAfterInteractions(() => {
            if(cb) cb();
          });
        } else {
          SndAlert.alert(
            '',
            '请在手机的'+'"'+'设置'+'"'+'中，允许千里眼访问您的相册',
            [
              {text: '取消', onPress: () => {
                  if(failCallback) failCallback();
                }},
              {text: '允许', onPress: () => {
                  if (Permissions.openSettings()) {
                    Permissions.openSettings();
                  }
                }}
            ]
          )
        }
      })
    }
  });
}

export function requestPhotoPermission(callback,failCallback) {
	if(Platform.OS==='ios'){
		requestIOSPhotosAccess(callback,failCallback);
	}else{
		requestExternalStorageAccess(callback,failCallback);
	}
}
