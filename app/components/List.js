
'use strict';
import React,{Component} from 'react';

import {
  View,

  Platform,
  RefreshControl,
  StyleSheet,
  RecyclerViewBackedScrollView,
  ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';
import ListView from 'deprecated-react-native-listview';
import Text from './Text';
import TouchFeedback from './TouchFeedback';
import ListSeperator from './ListSeperator';
import {GRAY,LINE,GREEN,LIST_BG, CLEAN_FILTER_BORDER,CLEAN_FILTER_BG,CLEAN_FILTER_TEXT} from '../styles/color';
// import ClickableRow from './ClickableRow.js';
import { SwipeRow } from 'react-native-swipe-list-view';

export default class List extends Component{
  static contextTypes = {
    navigator:PropTypes.object
  }
  constructor(props){
    super(props);
    this._rows = {};
    this._openCellId = null;
    this.state = {showRefreshControlStyle:true,showBottomLoading:false,clickable:{sectionId:null,rowId:null}};
  }
  _onEndReached(e){
    if(this.props.currentPage < this.props.totalPage && this.props.isFetching === false){
      this.props.nextPage();
    }
  }
  _renderHeader(){
    if(this.props.renderHeader){
      return this.props.renderHeader();
    }
    if(this.props.hasFilter){
      return this._getClearFilterView();
    }

    return null;
  }
  _renderSeperator(sectionId,rowId){
    if (this.props.renderSeperator) {
      return this.props.renderSeperator(sectionId,rowId);
    }
    return (
      <ListSeperator key={sectionId+rowId} />
    );
  }
  _renderSection(sectionData,sectionId){
    // console.warn('sectionId',typeof sectionId);
    if(this.props.renderSection){
      return this.props.renderSection(sectionData,sectionId);
    }
    if(sectionId !== 's1'){
      var content = this.props.renderSectionHeader && this.props.renderSectionHeader(sectionData,sectionId);
      if(content){
        var index = parseInt(sectionId);
        var borderTopWidth = 0;
        if(index === 0){
          borderTopWidth = 0;
        }
        else {
          //for create ticket select asset
          //when all section folded
          var sectionRows = this.props.listData.getSectionLengths();
          if(sectionRows[index-1] === 0){
            borderTopWidth = 0;
          }
          else {
            borderTopWidth = 1;
          }
        }

        return (
          <View style={{
              borderColor:LINE,
              borderBottomWidth:1,
              borderTopWidth}}>
            {content}
          </View>
        )
      }
      return null;
    }
    return null;

  }
  _renderFooter(){
    // console.warn('this.props.listData',this.props.listData);
    if(!this.props.listData) return null;
    if(this.props.renderFooter){
      return this.props.renderFooter();
    }
    //getRowAndSectionCount > 1 because there is 1 section by default
    if((this.props.listData.getRowAndSectionCount() > 1 ) &&
          (this.props.totalPage !== this.props.currentPage)){
      return (
        <View style={{height:40,justifyContent:'center',alignItems:'center'}}>
          <Text style={{color:'black'}}>加载中，请稍候...</Text>
        </View>
      )
    }

    return null;
  }
  _getClearFilterView(){
    return (
      <View style={{height:47}}>
        <View style={styles.clearFilterContainer}>
          <TouchFeedback onPress={()=>this.props.clearFilter()}>
            <View style={styles.clearFilter}>
              <Text style={{fontSize:13,color:'#333'}}>清空筛选条件</Text>
            </View>
          </TouchFeedback>
        </View>
        {/*<ListSeperator />*/}
      </View>
    );
  }
  _clickableRow(sectionId,rowId,highlightRow){
    // console.warn('memoRow',sectionId,rowId);
    // this.setState({
    //   clickable:{sectionId,rowId}
    // });
    // highlightRow(sectionId,rowId);
    // // this.forceUpdate();
  }
  _safeCloseOpenRow() {
		// if the openCellId is stale due to deleting a row this could be undefined
		if (this._rows[this._openCellId]) {
			this._rows[this._openCellId].closeRow();
		}
	}
	_onRowOpen(id) {
		if (this._openCellId && this._openCellId !== id) {
			this._safeCloseOpenRow();
		}
		this._openCellId = id;
	}

	_onRowPress(id) {
    // console.warn('pressed',this._openCellId,id);
		if (this._openCellId) {
			this._safeCloseOpenRow();
			this._openCellId = null;
		}
	}

	_onScroll(e) {
    // console.warn('_onScroll');

		if (this._openCellId) {
			this._safeCloseOpenRow();
			this._openCellId = null;

		}
		this.props.onScroll && this.props.onScroll(e);
	}
  _renderHiddenRow(rowData,sectionId,rowId){
    return this.props.renderHiddenRow(rowData,sectionId,rowId,()=>this._safeCloseOpenRow());
  }
  _renderRow(rowData,sectionId,rowId){
    // console.warn('renderRow');
    var rowComponent = this.props.renderRow(rowData,sectionId,rowId,()=>this._safeCloseOpenRow());
    // console.warn('rowComponent',rowComponent!==null,rowComponent);
    var hasAuth=true;
    if (this.props.getRowAuth) {
      hasAuth=this.props.getRowAuth(rowData,sectionId,rowId);
    }
    if(this.props.swipable&&hasAuth){
      return (
        <SwipeRow
            key={`${sectionId}-${rowId}`}
            ref={(row) => this._rows[`${sectionId}${rowId}`] = row}
						onRowOpen={ (_) => this._onRowOpen(`${sectionId}${rowId}`) }
						onRowPress={ (_) => this._onRowPress(`${sectionId}${rowId}`) }
						rightOpenValue={this.props.rightOpenValue}
            swipeToOpenPercent={10}
            swipeToOpenVelocityContribution={0}
            recalculateHiddenLayout={true}
						closeOnRowPress={true}
						disableLeftSwipe={false}
						disableRightSwipe={true}>
          {this._renderHiddenRow(rowData,sectionId,rowId)}
          {rowComponent}
        </SwipeRow>
      )
    }
    return rowComponent;

  }
  _getRefreshControl(){
    var refreshControl = null;
    if(this.props.onRefresh){
      var style;
      if(this.state.showRefreshControlStyle){
        style = {backgroundColor:'transparent'}
      }
      else {
        style = null;
      }
      // if(Platform.OS === 'android'){
      //   style = null;
      // }
      refreshControl = (
        <RefreshControl
          style={style}
          refreshing={this.props.isFetching}
          onRefresh={this.props.onRefresh}
          tintColor={GREEN}
          title="加载中，请稍候..."
          colors={[GREEN]}
          progressBackgroundColor={'white'}
        />
      );
      // console.warn('refreshControl');
    }
    return refreshControl;
  }
  componentDidMount() {
    // this._bindEvent();
  }
  componentWillReceiveProps(nextProps) {
    var gotoTop = this.props.needGotoTop && this._list&&nextProps.currentPage===1&&nextProps.isFetching;//&&nextProps.listData;
    if((!this.props.hasFilter && nextProps.hasFilter && this._list) || gotoTop){
      // console.warn('scrollTo',nextProps.isFetching);
      this._list.scrollTo({x:0,y:0,animated:false});
    }
    this.setState({showRefreshControlStyle:false});
  }
  componentWillUnmount() {
    this._listener && this._listener.remove();
  }
  render() {
    var list = (
      <View style={{flex:1,backgroundColor:'white'}}>
      </View>
    );
    var listData = this.props.listData;
    if(listData === null){
      var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
      listData = ds.cloneWithRows([]);
      if(this.props.isFetching === false){
        return (
          <ListView
            ref={(list)=>this._list = list}
            style={[styles.listCommonStyle,{backgroundColor:'white'},this.props.listStyle]}
            contentContainerStyle={[{backgroundColor:LIST_BG},this.props.contentContainerStyle]}
            refreshControl={this._getRefreshControl()}
            enableEmptySections={true}
            initialListSize={0}
            pageSize={0}
            renderRow={(rowData,sectionId,rowId)=>this._renderRow(rowData,sectionId,rowId)}
            keyboardDismissMode="interactive"
            stickyHeaderIndices={[]}
            dataSource={listData}
          />
        )
      }
    }
    // console.warn('List...render...',this.props.isFetching,listData.getRowCount(),listData.sectionIdentities.length,this.props.emptyText,listData);
    if(this.props.isFetching === false &&
              (listData.getRowCount() === 0 && (listData.sectionIdentities[0]==='s1')||listData.sectionIdentities.length===0)){
      var clearFilter = null;
      var text = this.props.emptyText;
      if(this.props.hasFilter){
        clearFilter = this._getClearFilterView();
      }

      list = (
        <View style={{flex:1}}>
          {clearFilter}
          <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
            <Text style={{fontSize:17,color:GRAY,textAlign:'center'}} numberOfLines={2}>{text}</Text>
          </View>
        </View>
      );
    }
    else{
      //renderScrollComponent={(props) => <RecyclerViewBackedScrollView {...props} />}

      list = (
        <ListView
          ref={(list)=>{
            this._list = list;
            if(this.props.setRef){
              this.props.setRef(list);
            }
          }}
          style={[styles.listCommonStyle,this.props.listStyle]}
          contentContainerStyle={[{backgroundColor:LIST_BG},this.props.contentContainerStyle]}
          refreshControl={this._getRefreshControl()}
          enableEmptySections={true}
          pageSize={this.props.pageSize?this.props.pageSize:20}
          removeClippedSubviews={false}
          onScroll={(e)=>this._onScroll(e)}
          scrollEventThrottle={1}
          keyboardDismissMode="interactive"
          stickyHeaderIndices={[]}
          stickySectionHeadersEnabled={this.props.sticky}
          onEndReachedThreshold={66*5}
          dataSource={listData}
          onEndReached={(e)=>this._onEndReached(e)}
          renderSeparator={(sectionId,rowId)=>this._renderSeperator(sectionId,rowId)}
          renderHeader={()=>this._renderHeader()}
          renderSectionHeader={(sectionData, sectionID)=>{
            return this._renderSection(sectionData,sectionID);
          }}
          renderRow={(rowData,sectionId,rowId)=>this._renderRow(rowData,sectionId,rowId)}
          renderFooter={() => this._renderFooter()}
        />);
    }

    return (
      <View style={{flex:1,backgroundColor:LIST_BG}}>
        {list}
      </View>

    );
  }
}

List.propTypes = {
  user:PropTypes.object,
  currentPage:PropTypes.number,
  totalPage:PropTypes.number,
  hasFilter:PropTypes.bool,
  onFilterClick:PropTypes.func,
  clearFilter:PropTypes.func,
  contentContainerStyle:ViewPropTypes.style,
  isFetching:PropTypes.bool.isRequired,
  listData:PropTypes.object,
  needGotoTop:PropTypes.bool,
  renderSectionHeader:PropTypes.func,
  renderRow:PropTypes.func.isRequired,
  getRowAuth:PropTypes.func,
  onRefresh:PropTypes.func,
  nextPage:PropTypes.func,
  renderHiddenRow:PropTypes.func,
  renderFooter:PropTypes.func,
  renderHeader:PropTypes.func,
  renderSeperator:PropTypes.func,
  emptyText:PropTypes.string,
}

List.defaultProps = {
  rightOpenValue:-80,
  swipable:false
}

var styles = StyleSheet.create({
  listCommonStyle:{
    flex:1,
    backgroundColor:'transparent',
    // backgroundColor:'red'
  },
  clearFilterContainer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
  },
  clearFilter:{
    width:120,
    height:26,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'white',//CLEAN_FILTER_BG,
    borderColor:'#e6e6e6',//CLEAN_FILTER_BORDER,
    borderWidth:1,
    borderRadius:13
  },
  content:{
    flex:1,
    // backgroundColor:'red'
  },
});
