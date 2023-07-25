import React, {Component} from 'react';
import { StyleSheet, View, Animated, Easing} from 'react-native';

import PropTypes from 'prop-types';
import Icon2 from "./Icon";

export default class RingRound extends Component {
    constructor(props) {
        super(props);
        this.spinValue = new Animated.Value(0)
        this.state = {
        };
    }
    componentDidMount(){
        this.spin();
    }
    //旋转方法
    spin = () => {
        this.spinValue.setValue(0)
        Animated.timing(this.spinValue,{
          toValue: 1, // 最终值 为1，这里表示最大旋转 360度
          duration: 4000,
          easing: Easing.linear,
          isInteraction:false
       }).start(() => this.spin())
    }
    render() {
        const { user, pwd, fadeAnim} = this.state;
        //映射 0-1的值 映射 成 0 - 360 度
        const spin = this.spinValue.interpolate({
            inputRange: [0, 1],//输入值
            outputRange: ['0deg', '360deg'] //输出值
          })
          // <Animated.Image style={[styles.circle,{transform:[{rotate: spin }]}]} source={}/>
        return(
            <View style={styles.container}>
              <Animated.View style={[styles.circle,{transform:[{rotate: spin }]}]}>
                {this.props.children}
              </Animated.View>
            </View>
        );
    }
}

RingRound.propTypes = {
  style:PropTypes.any,
  children:PropTypes.any
};

const styles = StyleSheet.create({
    container:{
        // flex:1,
        alignItems:'center',
        justifyContent:'center',
        // backgroundColor:'#00a0e4'
    },
    circle:{

        // position:'absolute',
        // width: 300,
        // height: 306
    }
});
