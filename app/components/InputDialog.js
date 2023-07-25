import React,{Component} from 'react';
import {View,Keyboard,Modal,TextInput,Text,TouchableOpacity,UIManager,Dimensions,
  findNodeHandle,Platform} from 'react-native';
import Icon from './Icon';
import TouchFeedback from './TouchFeedback';
const SH=Dimensions.get('window').height;
const IS_IOS=Platform.OS=='ios';
export default class InputDialog extends Component{

  constructor(props){
    super(props);
    let inputText=this.props.inputText;
    this.state={
      modalShow:this.props.modalShow,
      inputText:inputText,
      hiddenHeight:0,
      title:'',
      display:inputText?'flex':'none',
      disabled:inputText&&inputText.trim().length>0?false:true
    }
  }

  _registerEvents(){
    this._keyboardDidShowSubscription = Keyboard.addListener('keyboardDidShow', (e) => this._keyboardDidShow(e));
    this._keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', (e) => this._keyboardDidHide(e));
  }

  _unRegisterEvents() {
    this._keyboardDidShowSubscription && this._keyboardDidShowSubscription.remove();
    this._keyboardDidHideSubscription && this._keyboardDidHideSubscription.remove();
  }

  _keyboardDidShow(e) {
    // console.log(e);
    this.keyborderHeight=e.endCoordinates.height;
    this.isKeyboardShow=true;
    if(IS_IOS) {
      new Promise(() => {
        let node=findNodeHandle(this.refs.topView);
        if(node) {
          UIManager.measureInWindow(node, (x, y, w, h) => {
            if (this.keyborderHeight > (SH - (y + h + 60))) {
              let offset = this.keyborderHeight - (SH - (y + h + 60));
              this.setState({
                hiddenHeight: offset
              })
            }
          })
        }
      });
    }
  }

  _keyboardDidHide() {
    // console.log('_keyboardDidHide');
    this.isKeyboardShow=false;
    if(IS_IOS) {
      this.setState({
        hiddenHeight: 0
      })
    }
  }
  componentWillMount() {
    this._registerEvents();
  }

  componentWillUnmount() {
    this._unRegisterEvents();
  }

  componentWillReceiveProps(next){
    this.setState({modalShow:next.modalShow,inputText:next.inputText})

  }

  render(){
    return this.renderModal();
  }

  _onChangeText(text){
    this.setState({
      disabled:text&&text.trim().length>0?false:true,
      inputText:text,
      display:(text&&text.length>0)?'flex':'none'
    })
  }

  renderModal() {
    return (
      <Modal transparent={true} visible={this.state.modalShow} animationType={'fade'}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066'}}>
          <View ref='topView' style={{width: 270, height: 170, overflow: 'hidden', backgroundColor: '#fff', borderRadius: 4}}>
            <Text style={{fontSize: 18, color: '#333', alignSelf: 'center', marginTop: 20}}>{this.props.title}</Text>
            <View style={{flexDirection:'row',
              marginHorizontal: 20, height: 35, borderColor: '#e6e6e6', marginVertical: 18,
              borderWidth: 1, borderRadius: 2, alignItems: 'center', paddingHorizontal: 12
            }}>
              <TextInput style={{flex:1,fontSize:14,color:'#333',padding:0}} value={this.state.inputText} placeholder={this.props.hint}
                placeholderTextColor={'#d0d0d0'} underlineColorAndroid="transparent" returnKeyType={'done'} returnKeyLabel={'完成'}
                onChangeText={text=>this._onChangeText(text)} enablesReturnKeyAutomatically={true} autoFocus={true}/>
              <TouchableOpacity style={{display:this.state.display}} onPress={()=>this.setState({inputText:'',display:'none',disabled:true})}>
              <View style={{height:16,width:16,backgroundColor:'#c0c0c0',borderRadius:8,
                justifyContent:'center',alignItems:'center'}}>
                <Icon style={{alignSelf:'center'}} size={10} color={'#fff'} type={'icon_close'}/>
              </View>
              </TouchableOpacity>
            </View>

            <View style={{flex: 1}}/>
            <View style={{
              height: 47, width: 270, flexDirection: 'row', borderColor: '#e6e6e6',
              borderTopWidth: 1
            }}>
              <TouchableOpacity style={{flex:1}} onPress={() => {
                if(this.props.onCancel){
                  this.props.onCancel();
                }
              }}>
                <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                  <Text style={{fontSize: 17,color: '#007aff',}}>取消</Text>
                </View>
              </TouchableOpacity>
              <View style={{width: 1, backgroundColor: '#e6e6e6'}}/>
              <TouchableOpacity disabled={this.state.disabled} style={{flex: 1,height:47}} onPress={()=>{
                if(this.props.onClick){
                  return this.props.onClick(this.state.inputText.trim(),this.props.type);
                }
                this.setState({modalShow:false})
              }}>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={{fontSize: 17, color: this.state.disabled?'#c0c0c0':'#007aff'}}>完成</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{height:this.state.hiddenHeight}}/>
        </View>

      </Modal>
    )
  }
}
