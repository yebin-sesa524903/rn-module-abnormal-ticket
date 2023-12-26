
'use strict';
import React,{Component} from 'react';

import {
  View,
  Text,
  Alert
} from 'react-native';

import Toolbar from './components/Toolbar';
import TouchFeedback from './components/TouchFeedback';
import Icon from './components/Icon';

import moment from 'moment';
import DateTimePicker from 'react-native-modal-datetime-picker';
import backHelper from './utils/backHelper';
import {getLanguage, localStr} from "./utils/Localizations/localization";
import Colors from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";

export default class TicketSelectTime extends Component{
  constructor(props){
    super(props);
    let {startTime,endTime,canEditStart} =this.props;
    //判断格式
    let showHours=false;
    let mStart=moment(startTime);
    let mEnd=moment(endTime);
    // if(mStart.hours()>0||mStart.minutes()>0||mEnd.hours()>0||mEnd.minutes()>0){
    //   showHours=true;
    //   if(mStart.format('HH:mm')==='00:00' && mEnd.format('HH:mm')==='23:59'){
    //     showHours=false;
    //   }
    // }
    // showHours=true;
    this.state={showHours:false,mStart,mEnd,canEditStart:canEditStart};
  }

  componentDidMount() {
    backHelper.init(this.props.navigator,this.props.route.id);
  }

  componentWillUnmount() {
    backHelper.destroy(this.props.route.id);
  }

  _renderRow(title,value,enable,cb){
    var iconRight=(<Icon type="arrow_right" color="#888" size={14}/>);
    if (!enable) {
      iconRight=null;
    }
    return (
      <TouchFeedback enabled={enable} onPress={()=>cb()}>
        <View style={{flexDirection:'row',height:56,marginLeft:16,paddingRight:16,alignItems:'center',
          borderBottomColor:Colors.seBorderSplit,borderBottomWidth:1}}>
          <Text style={{fontSize:17,color:Colors.seTextTitle,flex:1}}>{title}</Text>
          <Text style={{fontSize:17,color:Colors.seTextPrimary,marginRight:6}}>{value}</Text>
          {iconRight}
        </View>
      </TouchFeedback>
    )
  }

  _renderPickerView() {
    return (
      <DateTimePicker
        is24Hour={true} locale={getLanguage()}
        titleIOS={localStr('lang_ticket_filter_select_date')}
        headerTextIOS={localStr('lang_ticket_filter_select_date')}
        titleStyle={{fontSize: 17, color: '#333'}}
        cancelTextIOS={localStr('lang_ticket_filter_cancel')}
        confirmTextIOS={localStr('lang_ticket_filter_ok')}
        mode={this.state.showHours?'datetime':'date'}
        datePickerModeAndroid={'spinner'}
        date={this._getDateTime()}
        onDateChange={(date) => {
          if(this.state.type==='start'){
            if(date.getTime()<=this.state.mEnd.toDate().getTime()){
              this.setState({
                mStartTmp:moment(date),
                // modalVisible: false
              })
            }

          }else{
            if(date.getTime()>=this.state.mStart.toDate().getTime()) {
              this.setState({
                mEndTmp: moment(date),
                // modalVisible: false
              })
            }
          }
        }}
        isVisible={this.state.modalVisible}
        onConfirm={(date) => {
          if(this.state.type==='start'){
            //判断开始时间不能晚于结束时间
            if(date.getTime()>this.state.mEnd.toDate().getTime()){
              this.setState({
                modalVisible: false
              },()=>{
                SndAlert.alert(localStr('lang_alert_title'),localStr('lang_ticket_select_time_invalid'))
              });
              return;
            }

            this.setState({
              mStart:moment(date),
              modalVisible: false
            })
          }else{
            //判断结束数据不能早于开始时间
            if(date.getTime()<this.state.mStart.toDate().getTime()) {
              this.setState({
                modalVisible: false
              },()=>{
                SndAlert.alert(localStr('lang_alert_title'),localStr('lang_ticket_select_time_invalid'))
              });
              return;
            }
            this.setState({
              mEnd:moment(date),
              modalVisible: false
            })
          }
        }}
        onCancel={() => {
          this.setState({modalVisible: false})
        }}
      />
    )
  }

  _getDateTime(){
    let time=null;
    if(this.state.type==='start'){
      time=this.state.mStartTmp||this.state.mStart;
    }else{
      time=this.state.mEndTmp||this.state.mEnd;
    }
    if(this.state.showHours){
      return moment(time).toDate();
    }else{
      return moment(time).toDate();
    }
  }

  _getFormatTime(time){
    if(this.state.showHours){
      return time.format('YYYY-MM-DD HH:mm')
    }else{
      return time.format('YYYY-MM-DD');
    }
  }

  render() {

    return (
      <View style={{flex:1,backgroundColor:Colors.seBgLayout}}>
        <Toolbar
          title={this.props.title}
          navIcon="back"
          actions={[{title:localStr('lang_toolbar_ok')}]}
          onActionSelected={[()=>{
            let format='YYYY-MM-DD HH:mm:ss';
            // console.log('state', this.state.mStart.format(format),this.state.mEnd.format(format))
            // if(this.state.showHours) format='YYYY-MM-DD HH:mm:ss';
            this.props.onChangeDate(this.state.mStart.format(format),this.state.mEnd.format(format));
            this.props.navigator.pop();
          }]}

          onIconClicked={this.props.onBack} />
        {this._renderRow(localStr('lang_ticket_filter_start_time'),this._getFormatTime(this.state.mStart),this.state.canEditStart,()=>{
          this.setState({
            modalVisible:true,
            type:'start',
            mStartTmp:this.state.mStart
          })
        })}
        {this._renderRow(localStr('lang_ticket_filter_end_time'),this._getFormatTime(this.state.mEnd),true,()=>{
          this.setState({
            modalVisible:true,
            type:'end',
            mEndTmp:this.state.mEnd
          })
        })}
        {this._renderPickerView()}
      </View>
    );
  }
}
