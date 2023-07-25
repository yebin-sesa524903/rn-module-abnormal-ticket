import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import appInfo from './appInfo.js';

//调用高德德图webapi 查询定位对应的地址信息
export function getAddressByLocation(location, res, err) {
  const map_key = appInfo.get().gaodeKey;
  let url = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${location.longitude},${location.latitude}&key=${map_key}&radius=500`;
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((responseData) => {
      console.log('responseData',responseData,url);
      if(responseData.status==='1'){
        let address=responseData.regeocode.formatted_address;
        if(address){
          if(address.constructor.name==='Array'){
            if(address.length>0){
              address=address[0];
            }else{
              address=null;
            }
          }
        }else {
          address=null;
        }
        //请求成功,给出格式化后的地址信息
        res && res({
          address:address,
          addressComponent:responseData.regeocode.addressComponent,
          lat:location.latitude,
          lon:location.longitude
        });
      }else{
        //请求失败
        console.log(responseData.info);
        err && err('获取地址信息失败')
      }
    })
    .catch((error) => {
      console.log(err);
      err && err('获取地址信息失败')
    })
}

//不传递参数获取当前位置地址信息
export function onlyGetGpsAddress(res,err) {
  //获取位置信息
  BackgroundGeolocation.getCurrentLocation(location=>{
    res({'lon':location.longitude,'lat':location.latitude});
  },error=>{
    console.log(error);
    err && err('获取定位失败');
  },{
    maximumAge:120*1000,
    enableHighAccuracy:true,
    timeout:5000
  });
}

//不传递参数获取当前位置地址信息
export function getAddress(res,err) {
  //获取位置信息
  BackgroundGeolocation.getCurrentLocation(location=>{
    convertGPSLocationToAMap(location,loc=>{
      getAddressByLocation(loc,res,err);
    },error=>{
      console.warn('GPS坐标转换出错',error);
      err && err(error);
    });
  },error=>{
    console.warn(error);
    err && err('获取定位失败');
  },{
    maximumAge:120*1000,
    enableHighAccuracy:true,
    timeout:5000
  });
}

//转换GPS定位坐标到高德地图坐标
export function convertGPSLocationToAMap(location,success,fail) {
  const map_key = appInfo.get().gaodeKey;
  let convertUrl=`https://restapi.amap.com/v3/assistant/coordinate/convert?locations=${location.longitude},${location.latitude}&coordsys=gps&output=json&key=${map_key}`;
  fetch(convertUrl).then(res=>{
    return res.json();
  }).then(res=>{
    if(res.status === '1'){
      let convertLocation=res.locations.split(',');
      success && success({latitude:convertLocation[1],longitude:convertLocation[0]});
    }else{
      console.log('坐标转换出错',res);
      fail && fail(res);
    }
  }).catch(err=>{
    console.log('坐标转换出错',err);
    fail && fail(err);
  });
}

//转换地址信息为GPS定位
export function getGPSFromAddress(address,success,fail) {
  const map_key = appInfo.get().gaodeKey;
  let convertUrl=`https://restapi.amap.com/v3/geocode/geo?address=${address}&output=json&key=${map_key}`;
  fetch(convertUrl).then(res=>{
    return res.json();
  }).then(res=>{
    let geocodes=res.geocodes;
    if(res.status === '1' && geocodes && geocodes[0] && geocodes[0].location){
      let gpsLocation = geocodes[0].location.split(',');
      if (gpsLocation) {
        success && success({latitude:gpsLocation[1],longitude:gpsLocation[0]});
      }
    }else{
      console.log('转换地址信息为GPS定位出错',res);
      fail && fail(res);
    }
  }).catch(err=>{
    console.warn('转换地址信息为GPS定位出错',err);
    fail && fail(err);
  });
}

//转换地址信息为GPS定位
export function getGPSFromAddressAndCity(address,city,success,fail) {
  const map_key = appInfo.get().gaodeKey;
  let convertUrl=`https://restapi.amap.com/v3/geocode/geo?address=${address}&city=${city}&output=json&key=${map_key}`;
  fetch(convertUrl).then(res=>{
    return res.json();
  }).then(res=>{
    let geocodes=res.geocodes;
    if(res.status === '1' && geocodes && geocodes[0] && geocodes[0].location){
      let gpsLocation = geocodes[0].location.split(',');
      if (gpsLocation) {
        let address=geocodes[0];
        success && success({latitude:gpsLocation[1],longitude:gpsLocation[0],address});
      }
    }else{
      console.log('转换地址信息为GPS定位出错',res);
      fail && fail(res);
    }
  }).catch(err=>{
    console.warn('转换地址信息为GPS定位出错',err);
    fail && fail(err);
  });
}

//转换GPS定位为地址
export function getAddressFromGPS(gpsInfo,success,fail) {
  const map_key = appInfo.get().gaodeKey;
  let convertUrl=`https://restapi.amap.com/v3/geocode/regeo?location=${gpsInfo.longitude},${gpsInfo.latitude}&output=json&key=${map_key}`;
  fetch(convertUrl).then(res=>{
    return res.json();
  }).then(res=>{
    let regeocode=res.regeocode;
    if(res.status === '1' && regeocode && regeocode.addressComponent){
      success && success(
        {
          address:regeocode.formatted_address,
          addressComponent:regeocode.addressComponent
        }
      );
    }else{
      console.log('转换GPS定位为地址出错',res);
      fail && fail(res);
    }
  }).catch(err=>{
    console.warn('转换GPS定位为地址出错',err);
    fail && fail(err);
  });
}

export function uploadLocation(location,url,headers,customerId) {
  //通过amap坐标转换，变成高德地图坐标 然后上传地址信息
  BackgroundGeolocation.startTask(taskKey=>{
    convertGPSLocationToAMap(location,res=>{
      let data=[{
        customerId : customerId,
        lat : res.latitude,
        lng : res.longitude
      }]
      //真实的上传
      fetch(url, {method:'POST', headers, body: JSON.stringify(data)})
        .then(res=>{
          BackgroundGeolocation.endTask(taskKey);
        })
        .catch(err=>{
          console.log('上传定位出错',err);
          BackgroundGeolocation.endTask(taskKey);
        });
    },err=>{
      BackgroundGeolocation.endTask(taskKey);
    });
  });
}

function processStartAndEndPosition(startPos,endPos,posType=0) {
  if(posType===0){
    return new Promise((resolve,reject)=>{
      resolve({
        startPos,endPos
      });
    });
  }

  let startPromise = new Promise((resolve,reject)=>{
    convertGPSLocationToAMap(startPos,res=>{
      startPos={
        latitude:res.latitude,
        longitude:res.longitude
      }
      resolve({
        startPos,endPos
      });
    },fail=>{
      reject('坐标转换失败')
    });
  });
  if(posType===1){
    return startPromise;
  }

  let endPromise = new Promise((resolve,reject)=>{
    convertGPSLocationToAMap(endPos,res=>{
      endPos={
        latitude:res.latitude,
        longitude:res.longitude
      }
      resolve({
        startPos,endPos
      });
    },fail=>{
      reject('坐标转换失败')
    });
  });
  if(posType===2){
    return endPromise;
  }
  if(posType===3){
    //只有两个都执行完成
    return Promise.all([startPromise,endPromise]).then(data=>{
      console.warn('data',data);
      return {
        startPos:data[0].startPos,
        endPos:data[1].endPos
      }
    });
  }
}

function calcDistanceAndTime(startPos,endPos,type,success,fail) {
  const map_key = appInfo.get().gaodeKey;
  let url=`https://restapi.amap.com/v3/direction/walking?origin=${startPos.longitude},${startPos.latitude}&destination=${endPos.longitude},${endPos.latitude}&key=${map_key}`;
  if(type==='driving'){
    url=`https://restapi.amap.com/v3/direction/driving?origin=${startPos.longitude},${startPos.latitude}&destination=${endPos.longitude},${endPos.latitude}&key=${map_key}`;
  }
   fetch(url).then(res=>{
      return res.json();
    }).then(res=>{
    if(res.status==='1'){
      //计算成功
      success({
        distance:res.route.paths[0].distance,
        duration:res.route.paths[0].duration
      })
    }else{
      fail&&fail(res.info);
    }
    }).catch(err=>{
      fail&&fail(err);
    });

}

//data={startPos,endPos,posType}
// startPos,endPos 开始定位和目标定位
// posType=0 表示startPos和endPos都不需要转成高德坐标
// posType=1 表示startPos需要转换成高德坐标
// posType=2 表示endPos需要转换成高德坐标
// posType=3 表示startPos和endPos都需要转成高德坐标
export function calcWalking(data,success,fail) {
  processStartAndEndPosition(data.startPos,data.endPos,data.posType).then(res=>{
    let {startPos,endPos}=res;
    calcDistanceAndTime(startPos,endPos,'walking',success,fail);
  }).catch(err=>{
    console.warn(err);
    fail&&fail(err);
  });
}

//data={startPos,endPos,posType}
// startPos,endPos 开始定位和目标定位
// posType=0 表示startPos和endPos都不需要转成高德坐标
// posType=1 表示startPos需要转换成高德坐标
// posType=2 表示endPos需要转换成高德坐标
// posType=3 表示startPos和endPos都需要转成高德坐标
export function calcDriving(data,success,fail) {
  processStartAndEndPosition(data.startPos,data.endPos,data.posType).then(res=>{
    let {startPos,endPos}=res;
    calcDistanceAndTime(startPos,endPos,'driving',success,fail);
  }).catch(err=>{
    console.warn(err);
    fail&&fail(err);
  });
}
