'use strict'

import React,{Component} from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';

import Text from './components/Text';
import Icon from './components/Icon.js';
import {GRAY,BLACK,ALARM_RED} from './styles/color';
import moment from 'moment';
import TouchFeedback from "./components/TouchFeedback";
import {localStr} from "./utils/Localizations/localization";



export default class TicketRow extends Component{
  constructor(props){
    super(props);
  }

  _getDateDisplay(){
    return `${moment(this.props.rowData.startTime).format('YYYY-MM-DD')} ${localStr('lang_ticket_to')} ${moment(this.props.rowData.endTime).format('YYYY-MM-DD')}`;

    let mStart=moment(this.props.rowData.startTime);
    let mEnd=moment(this.props.rowData.endTime);
    let showHour=false;
    let isSameDay=false;
    //判断是否要显示小数
    if(mStart.hours()>0||mStart.minutes()>0||mEnd.hours()>0||mEnd.minutes()>0){
      //需要显示的格式带小数
      showHour=true;
      if(mStart.format('HH:mm')==='00:00' && mEnd.format('HH:mm')==='23:59'){
        showHour=false;
      }
    }
    //判断开始结束日期是否同一天
    if(mStart.format('YYYY-MM-DD') === mEnd.format('YYYY-MM-DD')){
      isSameDay=true;
    }
    if(isSameDay&&showHour){//同一天，显示小时
      return `${mStart.format('MM-DD HH:mm')} ${localStr('lang_ticket_to')} ${mEnd.format('HH:mm')}`;
    }else if(showHour){//不是同一天，要显示小时
      return `${mStart.format('MM-DD HH:mm')} ${localStr('lang_ticket_to')} ${mEnd.format('MM-DD HH:mm')}`;
    }else{//不显示小时
      return `${mStart.format('MM-DD')} ${localStr('lang_ticket_to')} ${mEnd.format('MM-DD')}`;
    }
  }

  _getContent(){
    var {rowData} = this.props;
    let status=rowData.TicketType;
    var content = rowData.Content||'';
    var strContent = '';
    content.split('\n').forEach((item)=>{
      strContent+=item;
      strContent+=' ';
    });
    return strContent;
  }
  _newText(){
    var {rowData} = this.props;
    var startTime = moment(rowData.StartTime).format('YYYY-MM-DD');
    var endTime = moment(rowData.EndTime).format('YYYY-MM-DD');
    var nowTime = moment().format('YYYY-MM-DD');
    var status = rowData.Status|rowData.TicketStatus;
    var isExpire = false;
    if (status===1) {
      isExpire=startTime<nowTime;
    }else if (status===2) {
      isExpire=endTime<nowTime;
    }
    if (isExpire) {
      return(
        <View style={styles.expireView}>
          <Icon type='icon_over_due' size={18} color={ALARM_RED} />
          <Text style={styles.expireText}>{'逾期'}</Text>
        </View>
      );
    }
    return null;
  }

  _showRedDot(){
    return false;
  }


  render(){
    var {rowData} = this.props;
    var startTime = moment(rowData.startTime).format('YYYY-MM-DD');
    var endTime = moment(rowData.endTime).format('YYYY-MM-DD');
    var nowTime = moment().format('YYYY-MM-DD');
    var status = rowData.Status|rowData.TicketStatus;
    var isExpire = rowData.isExpired;
    // if (status===1||status===5) {
    //   isExpire=startTime<nowTime;
    // }else if (status===2) {
    //   isExpire=endTime<nowTime;
    // }

    // let redDot=null;
    // if(this._showRedDot()&&!(isExpire&&status===3)){
    //   redDot=<View style={{width:6,height:6,borderRadius:3,marginRight:3,
    //     backgroundColor:'#f00',alignSelf:'center'}}/>;
    // }

    let title = rowData.title;
    let locationPath = rowData.assets.map((item)=>item.assetName).join('、');
    return (
      <TouchFeedback  onPress={()=>this.props.onRowClick(rowData)}>
        <View style={{padding:16,backgroundColor:'#fff',marginBottom:10,borderRadius:2,
        }}>
          <View style={{flexDirection:'row',paddingHorizontal:16,paddingVertical:12,marginHorizontal:-16,marginBottom:-12,marginVertical:-16,alignItems:'center',justifyContent:'space-between',
            borderTopLeftRadius:2,borderTopRightRadius:2}}>
            <View style={{flexDirection:'row',alignItems:'center',flex:1,marginRight:12}}>
              <Text style={{color:'#333',fontSize:16,fontWeight:'600',flexShrink:1,marginRight:3}} numberOfLines={1}>{title}</Text>
            </View>
            <Text style={{fontSize:12,color:(isExpire?'#ff4d4d':'#888'),marginLeft:8,}}>{this._getDateDisplay()}</Text>
          </View>

          {/*<View style={{height:1,backgroundColor:'#f2f2f2',marginVertical:12}}/>*/}
          <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>
            {/*<Icon type="arrow_location" color="#b2b2b2" size={12}/>*/}
            <Text style={{marginLeft:0,color:'#b2b2b2',fontSize:13}} numberOfLines={1} lineBreakModel='charWrapping'>{locationPath}</Text>
          </View>
        </View>
      </TouchFeedback>
    );
  }

}

var styles = StyleSheet.create({
  rowHeight:{
    height:78
  },
  row:{
    backgroundColor:'transparent',
    padding:16,
    // justifyContent:'space-between'
  },
  titleRow:{
    flexDirection:'row',
    // backgroundColor:'red',
    flex:1,
    alignItems:'flex-start',
    justifyContent:'space-between',
  },
  titleText:{
    color:BLACK,
    fontSize:17
  },
  timeText:{
    color:GRAY,
    fontSize:12,
    marginLeft:6,
    marginTop:3,
  },
  expireText:{
    color:ALARM_RED,
    fontSize:12,
    marginLeft:6,
    marginTop:3,
  },
  expireView:{
    borderRadius:1,
    flexDirection:'row',
    // backgroundColor:'gray',
    justifyContent:'flex-start',
    alignItems:'center'
  },
  contentRow:{
    flex:1,
    marginTop:8,
    alignItems:'flex-start',
    flexDirection:'row',
  },
  contentText:{
    color:GRAY,
    fontSize:12
  },


});
