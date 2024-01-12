
'use strict';
import React,{Component} from 'react';

import {
  View,
  Text,
  Alert, Image, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';

import Toolbar from './components/Toolbar';
import backHelper from './utils/backHelper';
import {localStr} from "./utils/Localizations/localization";
import Loading from './components/Loading';
import {apiGetExecutorData, apiGetTicketExecutors} from "./middleware/bff";
import TouchFeedback from "./components/TouchFeedback";
import Icon from "./components/Icon";
import {GRAY, GREEN} from "./styles/color";
import Colors, {isDarkMode} from "../../../app/utils/const/Colors";
const CODE_OK = '0';

export default class TicketSelectExecutors extends Component{
  constructor(props){
    super(props);
    this.state = {isFetching:true}
  }

  componentDidMount() {
    backHelper.init(this.props.navigation,this.props.route.id);
    apiGetTicketExecutors(this.props.assets).then(ret => {
      if(ret.code === CODE_OK) {
        if(ret.data && ret.data.length === 0) {
          this.setState({data:[],isFetching:false})
        }else {
          //自动勾选
          ret.data.forEach(item => {
            if(this.props.executors.find(user => user.userId === item.userId)){
              item.isSelect = true;
            }
          })
          let users = ret.data;
          this.setState({data:users,isFetching:false})
          //查询执行人对应的工单数量
          let userIds = ret.data.map(item => item.userId);
          apiGetExecutorData(userIds).then(ret => {
            if(ret.code ==='0') {
              //更新执行人 工单情况
              ret.data.forEach( user => {
                let find = users.find(u => u.userId === user.userId);
                if(find) {
                  find.inProcessTicketCount = user.inProcessTicketCount;
                  find.notStartedTicketCount = user.notStartedTicketCount;
                }
              })
              this.setState({data:[].concat(users)})
            }
          })
        }
      }else {
        this.setState({data:[],isFetching:false})
      }
    })
  }

  componentWillUnmount() {
    backHelper.destroy(this.props.route.id);
  }

  _renderEmpty() {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:Colors.seBgContainer}}>
        <Image resizeMode={'contain'} source={isDarkMode() ? require('./images/empty_box/empty_box_dark.png') : require('./images/empty_box/empty_box.png')} style={{width: 128 * 0.5, height: 80 * 0.5}} />
        <Text style={{fontSize:15,color:Colors.seTextDisabled,marginTop:8}}>{localStr('lang_empty_data')}</Text>
      </View>
    )
  }

  _getNavIcon(item){
    if(item.isSelect){
      return (
        <View style={styles.selectView}>
          <Icon type='icon_check' size={10} color={Colors.seTextInverse} />
        </View>
      )
    }else {
      return (
        <View style={styles.unSelectView}>
        </View>
      )
    }
  }

  _renderItem = ({item}) => {
    return (
      <TouchableOpacity style={{flex:1}} onPress={()=>{
        item.isSelect = !item.isSelect
        this.setState({data:[].concat(this.state.data)})
      }}>
        <View style={styles.rowContent}>
          {this._getNavIcon(item)}
          <View style={{flex:1,flexDirection:'row',alignItems:'center'}}>
            <Text numberOfLines={1} style={styles.titleText}>
              {item.userName}
            </Text>
            <Text numberOfLines={1} style={{fontSize:14,color:Colors.seTextSecondary}}>
              {`${localStr('lang_status_2')}:${item.inProcessTicketCount || 0}  ${localStr('lang_status_1')}:${item.notStartedTicketCount || 0}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  _canSubmit() {
    if(!this.state.data) return false;
    return this.state.data.find(item => item.isSelect);
  }

  render() {
    let child = null;
    if(this.state.isFetching) {
      child = <Loading/>
    }else {
      if (!this.state.data || this.state.data.length === 0) child = this._renderEmpty();
      else {
        child = (
          <FlatList
            data={this.state.data}
            renderItem={this._renderItem}
            keyExtractor={item => item.userId}
          />
        )
      }
    }
    return (
      <View style={{flex:1,backgroundColor:Colors.seBgLayout}}>
        <Toolbar
          title={this.props.title}
          navIcon="back"
          actions={[{title:localStr('lang_toolbar_ok'),disable:!this._canSubmit()}]}
          onActionSelected={[()=>{
            let users = this.state.data.filter(item => item.isSelect);
            this.props.onChangeExecutors(users);
            this.props.navigation.pop();
          }]}
          onIconClicked={this.props.onBack} />
        {
          child
        }
      </View>
    );
  }
}

let styles = global.amStyleProxy(()=>StyleSheet.create({
  rowContent:{
    //height:62,
    flexDirection:'row',
    // justifyContent:'space-between',
    alignItems:'center',
    backgroundColor:Colors.seBgContainer,
    paddingHorizontal:16,
    paddingVertical:12,
    borderBottomColor:Colors.seBorderSplit,
    borderBottomWidth:1
  },
  titleText:{
    marginLeft:16,
    fontSize:17,
    flex:1,
    color:Colors.seTextPrimary//BLACK
  },
  subTitleText:{
    marginLeft:16,
    fontSize:15,
    color:Colors.seTextPrimary,//BLACK,
    backgroundColor:'red',
    width:80
  },
  selectView:{
    width:18,
    height:18,
    borderRadius:10,
    backgroundColor:Colors.seBrandNomarl,
    justifyContent:'center',
    alignItems:'center'
  },
  unSelectView:{
    width:18,
    height:18,
    borderRadius:10,
    borderColor:Colors.seBorderBase,
    borderWidth:1,
    // marginRight:16,
    justifyContent:'center',
    alignItems:'center'
  },
}));
