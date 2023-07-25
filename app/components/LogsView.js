
'use strict';
import React,{Component} from 'react';

import {
  View,
  //
  // InteractionManager,
} from 'react-native';
import PropTypes from 'prop-types';

import Toolbar from './Toolbar';


import List from './List.js';
import LogRow from './LogRow.js';
import RowDelete from './RowDelete.js'
export default class LogsView extends Component{
  constructor(props){
    super(props);

  }
  _renderRow(rowData,sectionId,rowId,closeRow){
    // console.warn('rowData',rowId);
    return (
      <LogRow
        key={rowId}
        rowData={rowData}
        onRowLongPress={this.props.onRowLongPress}
        onRowClick={(rowData)=>{
          closeRow();
          this.props.onRowClick(rowData)
        }} />
    );
  }
  _renderHiddenRow(rowData,sectionId,rowId,closeRow){
    // console.warn('_renderHiddenRow');
    return (
      <RowDelete onPress={()=>{
          closeRow();
          this.props.onRowLongPress(rowData)}} />
    )
  }
  _getToolbar(){
    var actions = null;
    if(this.props.showAdd !== false&&this.props.allLogPermission){
      actions = [{
        title:'添加',
        iconType:'add',
        code:this.props.privilegeCode,
        show:'always'}];
    }
    return (
      <Toolbar
        title={this.props.title}
        navIcon="back"
        actions={actions}
        onIconClicked={this.props.onBack}
        onActionSelected={[this.props.createLog]} />
    );
  }
  render() {
    return (
      <View style={{flex:1,backgroundColor:'white'}}>
        {this._getToolbar()}
        <List
          disableLeftSwipe={!this.props.showAdd}
          isFetching={this.props.isFetching}
          onRefresh={this.props.onRefresh}
          listData={this.props.logs}
          currentPage={null}
          totalPage={null}
          swipable={this.props.allLogPermission?true:false}
          emptyText={this.props.emptyText}
          renderHiddenRow={(rowData,sectionId,rowId,rowMap)=>this._renderHiddenRow(rowData,sectionId,rowId,rowMap)}
          renderRow={(rowData,sectionId,rowId,rowMap)=>this._renderRow(rowData,sectionId,rowId,rowMap)}
        />
      </View>

    );
  }
}

LogsView.propTypes = {
  user:PropTypes.object,
  isFetching:PropTypes.bool,
  showAdd:PropTypes.bool,
  onRowClick:PropTypes.func.isRequired,
  onRefresh:PropTypes.func.isRequired,
  privilegeCode:PropTypes.string.isRequired,
  onRowLongPress:PropTypes.func.isRequired,
  logs:PropTypes.object,
  emptyText:PropTypes.string.isRequired,
  createLog:PropTypes.func.isRequired,
  onBack:PropTypes.func.isRequired,
  title:PropTypes.string.isRequired,
}
