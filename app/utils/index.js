'use strict';

import { Dimensions } from 'react-native';

const PASS_REG = /^(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[~`!@#\$%&\^\*\(\)\-=_\+<>\/:;\{\}\[\]\?\.])[a-zA-Z0-9~`!@#\$%&\^\*\(\)\-=_\+<>\/:;\{\}\[\]\?\.]{8,}$/;

export function verifyPass(pass) {
  return PASS_REG.test(pass);
}

export function isPhoneX() {
  var {width,height} = Dimensions.get('window');
  var isPhoneX=(width===812||height===812)||(width===896||height===896);
  return isPhoneX;
}
