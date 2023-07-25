import React,{Component} from 'react';
import {View,Keyboard,Modal,TextInput,Text,TouchableOpacity,UIManager,Dimensions,findNodeHandle} from 'react-native';
import Icon from './Icon';
const SH=Dimensions.get('window').height;
export default class AlertDialog extends Component{

  constructor(props){
    super(props);
  }

  render(){
    return this.renderModal();
  }

  _renderButtons(){
    let buttons = this.props.buttons;
    let viewButtons=[];
    if(buttons && buttons.length>0){
      let count=buttons.length;
      for(let i=0;i<count;i++){
        let textColor='#007aff';
        if(buttons[i].textColor) textColor=buttons[i].textColor;
        viewButtons.push(
          <TouchableOpacity key={i} style={{flex: 1}} onPress={() => {
            if(this.props.onClick){
              this.props.onClick(i);
            }
          }}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{fontSize: 17, color: textColor}}>{buttons[i].text}</Text>
            </View>
          </TouchableOpacity>
        );
        if(i<count-1){
          viewButtons.push(
            <View key={i+1000+i} style={{width: 0.5,height:44, backgroundColor: '#7d7d7d'}}></View>
          );
        }
      }
      return viewButtons;
    }else{
      return null;
    }
  }

  _renderTitleAndMessage(){
    let views=[];
    if(this.props.title){
      views.push(
        <Text key={0} style={{fontSize:17,color:'#030303'}}>
          {this.props.title}
        </Text>
      )
    }
    if(this.props.message){
      let mt=views.length>0?12:0;
      views.push(
        <Text key={1} style={{fontSize:13,color:'#030303',marginTop:mt}}>
          {this.props.message}
        </Text>
      )
    }
    if(views.length>0) return views;
    return null;
  }

  renderModal() {
    return (
      <Modal transparent={true} visible={this.props.modalShow} animationType={'fade'}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066'}}>
          <View ref='topView' style={{width: 270, height: 138, overflow: 'hidden', backgroundColor: '#fff', borderRadius: 12}}>
            <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:16}}>
              {this._renderTitleAndMessage()}
            </View>

            <View style={{height:0.5,width:270,backgroundColor:'#4d4d4d'}}/>
            <View style={{
                height: 44, width: 270, flexDirection: 'row',alignItems:'center'
              }}>
              {this._renderButtons()}
            </View>
          </View>
        </View>

      </Modal>
    )
  }
}