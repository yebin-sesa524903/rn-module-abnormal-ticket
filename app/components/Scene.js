'use strict';
import React,{Component} from 'react';

import {
  StatusBar,
  // View,
} from "react-native";
import {Navigator} from 'react-native-deprecated-custom-components';
import PropTypes from 'prop-types';
import {STATUSBAR_COLOR} from '../styles/color';
// import Hud from './Hud.js';
import ContextComponent from './ContextComponent.js';

export default class Scene extends Component {
  getChildContext() {
    return {
      showSpinner:()=>{
        this._hud.showSpinner();
      },
      hideHud:()=>{
        this._hud.hide();
      }
    };
  }
  _renderScene(route, navigator) {
    const Component = route.component;
    var barStyle = 'default';
    if(route.barStyle){
      barStyle = route.barStyle;
    }
    return (
      <ContextComponent navigator={navigator}>
        <StatusBar barStyle={barStyle} translucent={true} backgroundColor={STATUSBAR_COLOR} />
        <Component
          navigator={navigator}
          route={route}
          {...route.passProps}
        />
      </ContextComponent>
    );
  }
  _setNavigatorRef(navigator) {
    if (navigator !== this._navigator) {
      this._navigator = navigator;
    }
  }
  getNavigator(){
    // console.warn('getNavigator',this.refs.navigator.resetTo);
    return this._navigator;
  }
  render() {
    return (
      <Navigator
        ref={(navigator)=>this._setNavigatorRef(navigator)}
        style={{flex: 1,backgroundColor:'white'}}
        renderScene={(route,navigator)=>this._renderScene(route,navigator)}
        initialRoute={this.props.initComponent}
        onDidFocus={(route)=>{
          // console.warn('did focus:',route?route.id:route);
        }}
        configureScene={(route) => {
            if (route && route.sceneConfig) {
              if(typeof route.sceneConfig === 'string'){
                return Navigator.SceneConfigs[route.sceneConfig];
              }
              return route.sceneConfig;
            }
            return Navigator.SceneConfigs.FloatFromRight;
          }}
      />
    );
  }
}

Scene.propTypes = {
  initComponent:PropTypes.object.isRequired
}

Scene.childContextTypes = {
  showSpinner: PropTypes.func,
  hideHud: PropTypes.func
}
