import ViewTransformer from 'react-native-view-transformer';
import React,{Component} from "react";
import {Dimensions, Text, View} from "react-native";
import CacheImage from "./CacheImage";

export class ImageViewer extends Component {

  constructor(props) {
    super(props);
    this.width = Dimensions.get('window').width - 40;
    this.height = Dimensions.get('window').height -40;
    console.log('imageKey',this.props.imageKey)
  }

  render() {
    return (
      <ViewTransformer maxScale={2} enableResistance={true}
                       enableTransform={true} //disable transform until image is loaded
                       enableScale={true}
                       enableTranslate={true}
                       enableResistance={true}
      >
        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f00'}}>
          <CacheImage key={this.props.imageKey} imageKey={this.props.imageKey} width={100} height={100} />
        </View>
      </ViewTransformer>

    );
  }
}
