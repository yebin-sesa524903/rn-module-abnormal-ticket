import React,{Component} from 'react';
import {View,Modal,Text,TouchableOpacity,Dimensions, Platform,
  ScrollView} from 'react-native';
import WebView from 'react-native-webview';
import TouchFeedback from "./TouchFeedback";
const SH=Dimensions.get('window').height;
const SW=Dimensions.get('window').width;
const IS_IOS=Platform.OS=='ios';

export default class InputDialog extends Component{

  constructor(props){
    super(props);
    this.state={
      modalShow:this.props.modalShow,
      content:'加载中....'
    }
  }

  componentDidMount(){
    // this._getUrlContent(this.props.url);
  }

  componentWillReceiveProps(next){
    if(next.modalShow&&(next.modalShow!=this.props.modalShow)){
      this._webLoaded=false;
      this._openLink=null;
    }
    this.setState({modalShow:next.modalShow,inputText:next.inputText})

  }

  render(){
    return this.renderModal();
  }

  _openLinkUrl(url){
    if(this.props.openLink){
      this.props.openLink(url);
    }
  }

  _getUrlContent(url){
    this.setState({isLoading:true});
    return fetch(url)
      .then((response)=>{
        console.log('url content:',response,response._bodyText);
        if(response.status === 204){
          this.setState({
            content:''
          })
          return;
        }else if(response.status === 403){
          this.setState({
            content:`<a href="reload">被禁止访问，点击重试</a>`
          });
          return;
        }
        this.setState({
          content:response._bodyText
        })
      })
      .catch(e=>{
        console.log(this.state.url,e);
        //展示页面加载失败，点击重新加载！
        this.setState({
          content:`<a href="reload">加载失败，点击重新加载</a>`
        })
      });
  }

  _onShouldStartLoadWithRequest(e) {
    // console.log(e);
    if (e.url&&this._webLoaded) {
      // let Router = this.props.navigator.props.router;
      // let route = Router.getRouteFromUrl(e.url);
      // this.props.navigator.push(route);
      //
      // this.refs[WEBVIEW_REF].stopLoading();  // <---- Add a similar line
      //This will tell your webView to stop processing the clicked link
      if(this.refs.webview&&this._webLoaded) {
        this.refs.webview.stopLoading();
        if(e.url!=this._openLink&&e.url!=this.props.url){
          //不同的链接跳转
          this._openLinkUrl(e.url);
          this._openLink=e.url;
        }
      }
      return false;

    }
    return true;
  }

  _webViewLoaded(e){
    // console.log('load..',e);
    this._webLoaded=true;
  }

  _pageLoadError(){
    /**
    return (
      <View style={{justifyContent:'center',alignItems:'center',flex:1}}>
          <View style={{paddingVertical:10,borderRadius:4,borderColor:'#3dcd58',marginTop:-1,
            alignItems:'center',paddingHorizontal:16,borderWidth:1,flexDirection:'row'}}>
            <TouchFeedback onPress={()=>{this._webLoaded=false;this.refs.webview.reload()}}>
              <View style={{flexDirection:'row'}}>
                <Text style={{marginLeft:8,fontSize:17,color:'#3dcd58'}}>加载失败，点击重新加载</Text>
              </View>
            </TouchFeedback>
          </View>
      </View>
    );
    **/
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <Text style={{fontSize:12,color:'#888'}}>页面加载失败,请检查网络</Text>
      </View>
    )
  }

  renderModal() {
    return (
      <Modal transparent={true} visible={this.state.modalShow} animationType={'fade'}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066'}}>
          <View ref='topView' style={{width:SW-60,height:SH*0.6, backgroundColor: '#fff', borderRadius: 4}}>
            <View style={{flex:1,marginTop:20,overflow:'hidden'}}>
            <WebView ref={'webview'} style={{backgroundColor:'#fff'}}
                     source={{uri: this.props.url}}
                     javaScriptEnable={true}
                     bounces={false}
                     useWebKit={true}
                     mixedContentMode={'compatibility'}
                     onLoadEnd={(e)=>this._webViewLoaded(e)}
                     onError={()=>this._pageLoadError()}
                     renderError={()=>this._pageLoadError()}
                     onNavigationStateChange = {(e)=>this._onShouldStartLoadWithRequest(e)}
            />
            </View>
            <View style={{
              height: 47, flexDirection: 'row', borderColor: '#e6e6e6',
              borderTopWidth: 1
            }}>
              <TouchableOpacity style={{flex:1}} onPress={() => {
                if(this.props.onCancel){
                  this.props.onCancel();
                }
              }}>
                <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                  <Text style={{fontSize: 17,color: '#007aff',}}>拒绝</Text>
                </View>
              </TouchableOpacity>
              <View style={{width: 1, backgroundColor: '#e6e6e6'}}/>
              <TouchableOpacity disabled={this.state.disabled} style={{flex: 1,height:47}} onPress={()=>{
                if(this.props.onClick){
                  return this.props.onClick();
                }
                this.setState({modalShow:false})
              }}>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={{fontSize: 17, color: this.state.disabled?'#c0c0c0':'#007aff'}}>同意</Text>
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
