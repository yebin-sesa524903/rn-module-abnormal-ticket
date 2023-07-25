import React, { Component } from 'react';
import { Dimensions,Text,View, Image, ImageStyle, StyleSheet, TouchableOpacity } from 'react-native';
// import Icon from '../icon';
import {GREEN} from '../../../styles/color';
import Icon from '../../Icon';
import TouchFeedback from '../../TouchFeedback';
export type ImageItemProps = {
  item?: any;
  selected?: boolean;
  selectedMarker?: JSX.Element;
  imageMargin: number;
  containerWidth?: number;
  imagesPerRow: number;
  onPress?: (...args: any[]) => any;
};
class ImageItem extends Component<ImageItemProps, {}> {
  static defaultProps = {
    item: {},
    selected: false,
  };
  _imageSize: number;
  constructor(props: ImageItemProps) {
    super(props);
  }
  componentWillMount() {
    let { width } = Dimensions.get('window');
    const { imageMargin, imagesPerRow, containerWidth } = this.props;
    if (typeof containerWidth !== 'undefined') {
      width = containerWidth;
    }
    this._imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
  }
  render() {
    const { item, selected, selectedMarker, imageMargin } = this.props;
    if (!item) {
      return null;
    }
    // const marker = selectedMarker ? (
    //   selectedMarker
    // ) : (
    //   <Icon
    //     name="check-circle"
    //     style={[styles.marker]}
    //   />
    // );
      var masker = null,icon;
      if(selected){
          masker = (
              <View style={styles.masker}>
              </View>
          )
          icon = (
              <Icon type="icon_check" color={'white'} size={15} />
          );
      }
    const image = item.node.image;

    return(
        <View style={{ marginBottom: imageMargin, marginRight: imageMargin }}>
            <Image
                source={{ uri: image.uri }}
                style={{ height: this._imageSize, width: this._imageSize }}
            />
            {masker}
            <View style={styles.chooserContainer}>
                <TouchFeedback
                    onPress={() => this._handleClick(image)}
                    style={{flex:1,}}>
                    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                        <View style={[selected?styles.chosen:styles.chooser]}>
                            {icon}
                        </View>
                    </View>

                </TouchFeedback>
            </View>

        </View>
    );
  }
  _handleClick(item: any) {
    if (this.props.onPress) {
      this.props.onPress(item);
    }
  }
}
const styles = StyleSheet.create<{
  marker: ImageStyle;
}>({
  marker: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'transparent',
  },
    masker:{
        position:'absolute',
        top:0,
        left:0,
        right:0,
        bottom:0,
        backgroundColor:'black',
        opacity:0.4
    },
    chooserContainer:{
        width:44,
        height:44,
        position:'absolute',
        // backgroundColor:'red',
        top:0,
        right:0,
    },
    chooser:{
        borderWidth:2,
        borderColor:'white',
        width:20,
        height:20,
        borderRadius:2,
    },
    chosen:{
        backgroundColor:GREEN,
        borderWidth:1,
        borderColor:GREEN,
        width:18,
        height:18,
        borderRadius:2,
    },
});

export default ImageItem;
