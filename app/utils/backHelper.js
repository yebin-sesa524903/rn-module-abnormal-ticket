'use strict';

import {
  BackHandler,
  Platform
} from 'react-native';

var handlerMap = {};

var pop = (nav)=>{
  nav.pop();
}

var defaultHandler = (nav,id,func)=>{
  // console.warn('backHelper',nav);
  if(func){
    func();
  }
  else{
    pop(nav)
  }
}



export default {
  init(nav,id,func){
    if(Platform.OS === 'android'){
      // console.warn('init route.id',id);
      handlerMap[id] = ()=>{
        defaultHandler(nav,id,func);
        return true;
      }
      BackHandler.addEventListener('hardwareBackPress',handlerMap[id]);
    }
  },
  destroy(id){
    if(Platform.OS === 'android'){
      BackHandler.removeEventListener('hardwareBackPress',handlerMap[id]);
      handlerMap[id] = null;
    }
  }
}
