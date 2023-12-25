
'use strict';
import React,{Component} from 'react';
import {
  View,
  StyleSheet,
  InteractionManager
} from 'react-native';
import PropTypes from 'prop-types';

// import Swiper from '../Swiper';
import Toolbar from '../Toolbar';
import Gallery from './Gallery';
import PhotoRow from './PhotoRow.js';
import {localStr} from "../../utils/Localizations/localization";
import Colors from "../../../../../app/utils/const/Colors";

export default class PhotoShowView extends Component{
  constructor(props){
    super(props);
    this.state={currIndex:this.props.index || 0,showPhoto:false};
  }
  componentDidMount() {
    InteractionManager.runAfterInteractions(()=>{
      this._showPhoto();
    });
  }
  _showPhoto(){
    this.setState({showPhoto:true});
  }
  _getToolbar(){
    var actions = null;
    var numIndex = this.state.currIndex+1;
    var title=localStr('lang_image_picker_title');
    return (
      <Toolbar
        title={title+'('+(numIndex)+'/'+this.props.data.length+')'}
        navIcon="back"
        actions={actions}
        onActionSelected={[]}
        onIconClicked={this.props.onBack}
        />
    );
  }

  _getContentView() {
    let images=this.props.data.map((rowData,index)=>{
        var name = rowData.key;
        if(rowData.uri) name = rowData.uri
        return name;
      }
    );
    let texts=this.props.data.map((rowData,index)=>{
        return rowData.name
      }
    )
      return (
        <Gallery
          ref='galleryRef'
          style={{flex: 1, backgroundColor: Colors.seBgLayout,zIndex:2}}
          index={this.state.currIndex}
          images={images}
          thumbImageInfo={this.props.thumbImageInfo}
          texts={texts}
          onPageChanged={(index)=>{
              this.setState({currIndex:index})
          }}
        />
      );
  }
  render() {
    return (
      <View style={{flex:1,backgroundColor:'black'}}>
        {this._getToolbar()}
        {this._getContentView()}
      </View>
    );
  }
}

PhotoShowView.propTypes = {
  user:PropTypes.object,
  onRowClick:PropTypes.func.isRequired,
  onPageChange:PropTypes.func.isRequired,
  onRemoveItem:PropTypes.func,
  checkAuth:PropTypes.func,
  swiper:PropTypes.object,
  data:PropTypes.object,
  thumbImageInfo:PropTypes.object,
  index:PropTypes.string,
  type:PropTypes.string,
  onBack:PropTypes.func.isRequired,
  canEdit:PropTypes.bool
}

var styles = StyleSheet.create({
  wrapper: {
    backgroundColor:'black',
    // flex:1,
  },
})
