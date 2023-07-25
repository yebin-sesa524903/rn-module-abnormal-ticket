import React,{Component} from 'react';
import {View,Text,Platform,BackHandler} from 'react-native';
import WebView from 'react-native-webview';
import Toolbar from './Toolbar';
import AppInfo from '../utils/appInfo'
const ID = '_privacy_';
const POST_MESSAGE = '___POST_MESSAGE___';

export default class WebPage extends Component{

  constructor(props){
    super(props);
    this.state={
      url:this.props.url,
      title:this.props.title,
      canGoBack:false,
    }
  }

  _hardwareBackPress=()=>{
    this._doBack();
    return true;
  }

  componentDidMount(){
    if(Platform.OS !== 'ios'){
      BackHandler.addEventListener('hardwareBackPress',this._hardwareBackPress);
    }
    if(this.props.showPrivacyAction){
      AppInfo.isTraceEnabled().then(res => {
        let enable = res === 'true';
        this.setState({isEnable:enable})
      });
    }
  }

  componentWillUnmount() {
    if(Platform.OS !== 'ios'){
      BackHandler.removeEventListener('hardwareBackPress',this._hardwareBackPress);
    }
  }

  _doBack(){
    console.log('_doback,state',this.state);
    if(this.state.canGoBack){
      this.refs.webview.goBack();
    }else{
      //如果有doback
      if(this.props.doBack){
        this.props.doBack();
      }else {
        this.props.navigator.pop();
      }
    }
  }

  _getToolbar(){
    return (
      <Toolbar
        title={this.props.title?this.props.title:this.state.title}
        navIcon="back"
        onIconClicked={()=>this._doBack()}
      />
    );
  }

  _renderErrorPage(){
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <Text style={{fontSize:12,color:'#888'}}>页面加载失败,请检查网络</Text>
      </View>
    )
  }

  render(){
    return (
      <View style={{flex:1,backgroundColor:'white'}}>
        {this._getToolbar()}
        <View style={{flex:1,overflow:'hidden'}}>
        <WebView ref={'webview'}
          source={{uri: this.state.url}}
          javaScriptEnable={true}
          onMessage={(event) => {
           //防止嵌入网页发送了js同名事件
           if(event.nativeEvent.data === POST_MESSAGE) {
             let value = !this.state.isEnable;
             AppInfo.enableTrace(value);
             this.refs.webview.postMessage(value);
             this.setState({isEnable:value})
           }
          }}
          bounces={false}
          useWebKit={true}
          onLoadEnd={(e)=>this._webViewLoaded(e)}
          renderError={()=>this._renderErrorPage()}
          onError={()=>this._renderErrorPage()}
          mixedContentMode={'compatibility'}
        />
        </View>
      </View>
    )
  }

  _webViewLoaded(e){
    let data=e.nativeEvent;
    this.setState({title:data.title,canGoBack:data.canGoBack});
    let target = Platform.OS === 'ios' ? 'window': 'document';
    if(!this.props.showPrivacyAction) return;
    let js = `
    let node = document.createElement('div');
    node.style="height: 40px;background-color: white;margin:16px;border:solid 1px #3DCD58;border-radius: 6px;display: flex;align-items: center;justify-content: center;font-size: 16px;color: #3DCD58;";
    node.onclick = () => {window.ReactNativeWebView.postMessage(\'${POST_MESSAGE}\')};
    node.innerText='${this.state.isEnable ? '点击关闭 用户行为统计分析':'点击开启 用户行为统计分析'}';
    node.id='${ID}';
    document.body.append(node);
    let space = document.createElement('div');
    space.style="height:6px";
    document.body.append(space);

    ${target}.addEventListener('message', function (e) {
      const enable = e.data === 'true' ? true:false;
      node.innerText = enable?'点击关闭 用户行为统计分析':'点击开启 用户行为统计分析'
    })
    `;
    this.refs.webview.injectJavaScript(js);
  }
}
