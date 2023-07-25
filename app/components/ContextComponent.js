'use strict';
import React,{Component} from 'react';

import {
  View,
} from "react-native";
import PropTypes from 'prop-types';
import Hud from './Hud.js';

export default class ContextComponent extends Component {
  static childContextTypes = {
    showSpinner: PropTypes.func,
    hideHud: PropTypes.func,
    navigator:PropTypes.object,
  };
  getChildContext() {
    return {
      showSpinner:(step)=>{
        this._hud.showSpinner(step);
      },
      hideHud:()=>{
        this._hud.hide();
      },
      navigator:this.props.navigator
    };
  }
  render() {
    return (
      <View style={{flex:1}}>
        {this.props.children}
        <Hud ref={(hud)=>this._hud=hud} />
      </View>
    );
  }
}

ContextComponent.propTypes = {
  children:PropTypes.any.isRequired,
  navigator:PropTypes.any.isRequired
}

// ContextComponent.childContextTypes = {
//   showSpinner: PropTypes.func,
//   hideHud: PropTypes.func,
//
// }
