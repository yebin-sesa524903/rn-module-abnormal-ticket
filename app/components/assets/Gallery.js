import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  PixelRatio,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';

import ViewPager from './ViewPager.js';
import {createResponder} from 'react-native-gesture-responder';
import Text from '../Text';
import NetworkImage from '../NetworkImage';
import {isPhoneX} from "../../utils";

export default class Gallery extends Component {

  imageRefs = new Map();
  activeResponder = undefined;
  firstMove = true;
  currentPage = 0;
  pageCount = 0;
  gestureResponder = undefined;

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    function onResponderReleaseOrTerminate(evt, gestureState) {
      var shouldScroll=this.shouldScrollViewPager(evt, gestureState);
      if (this.activeResponder) {
        if (this.activeResponder === this.viewPagerResponder
          && !shouldScroll
          && Math.abs(gestureState.vx) > 0.5) {
          // console.warn('shouldScroll...',shouldScroll);
          this.activeResponder.onEnd(evt, gestureState, true);
          this.getViewPagerInstance().flingToPage(this.currentPage, gestureState.vx);
        } else {
          // console.warn('activeResponder.onEnd...');
          this.activeResponder.onEnd(evt, gestureState);
        }
        this.activeResponder = null;
      }
      this.firstMove = true;
      this.props.onGalleryStateChanged && this.props.onGalleryStateChanged(true);
    }

    this.gestureResponder = createResponder({
      onStartShouldSetResponderCapture: (evt, gestureState) => true,
      onStartShouldSetResponder: (evt, gestureState) => {
        return true;
      },
      onResponderGrant: (evt, gestureState) => {
        this.activeImageResponder(evt, gestureState);
      },
      onResponderMove: (evt, gestureState) => {
        if (this.firstMove) {
          this.firstMove = false;
          if (this.shouldScrollViewPager(evt, gestureState)) {
            this.activeViewPagerResponder(evt, gestureState);
          }
          this.props.onGalleryStateChanged && this.props.onGalleryStateChanged(false);
        }
        if (this.activeResponder === this.viewPagerResponder) {
          const dx = gestureState.moveX - gestureState.previousMoveX;
          const offset = this.getViewPagerInstance().getScrollOffsetFromCurrentPage();
          if (dx > 0 && offset > 0 && !this.shouldScrollViewPager(evt, gestureState)) {
            if (dx > offset) { // active image responder
              this.getViewPagerInstance().scrollByOffset(offset);
              gestureState.moveX -= offset;
              this.activeImageResponder(evt, gestureState);
            }
          } else if (dx < 0 && offset < 0 && !this.shouldScrollViewPager(evt, gestureState)) {
            if (dx < offset) { // active image responder
              this.getViewPagerInstance().scrollByOffset(offset);
              gestureState.moveX -= offset;
              this.activeImageResponder(evt, gestureState);
            }
          }
        }
        this.activeResponder.onMove(evt, gestureState);
      },
      onResponderRelease: onResponderReleaseOrTerminate.bind(this),
      onResponderTerminate: onResponderReleaseOrTerminate.bind(this),
      onResponderTerminationRequest: (evt, gestureState) => false, //Do not allow parent view to intercept gesture
      onResponderSingleTapConfirmed: (evt, gestureState) => {
        this.props.onSingleTapConfirmed && this.props.onSingleTapConfirmed(this.currentPage);
      }
    });

    this.viewPagerResponder = {
      onStart: (evt, gestureState) => {
        var instance=this.getViewPagerInstance();
        if (!instance) {
          console.warn('0instance is release...');
          return;
        }
        instance.onResponderGrant(evt, gestureState);
      },
      onMove: (evt, gestureState) => {
        var instance=this.getViewPagerInstance();
        if (!instance) {
          console.warn('1instance is release...');
          return;
        }
        instance.onResponderMove(evt, gestureState);
      },
      onEnd: (evt, gestureState, disableSettle) => {
        var instance=this.getViewPagerInstance();
        if (!instance) {
          console.warn('2instance is release...');
          return;
        }
        instance.onResponderRelease(evt, gestureState, disableSettle);
      }
    }

    this.imageResponder = {
      onStart: ((evt, gestureState) => {
        var instance=this.getCurrentImageTransformer();
        if (!instance) {
          console.warn('3instance is release...');
          return;
        }
        this.getCurrentImageTransformer().onResponderGrant(evt, gestureState);
      }),
      onMove: (evt, gestureState) => {
        var instance=this.getCurrentImageTransformer();
        if (!instance) {
          console.warn('4instance is release...');
          return;
        }
        this.getCurrentImageTransformer().onResponderMove(evt, gestureState);
      },
      onEnd: (evt, gestureState) => {
        var instance=this.getCurrentImageTransformer();
        if (!instance) {
          console.warn('5instance is release...');
          return;
        }
        this.getCurrentImageTransformer().onResponderRelease(evt, gestureState);
      }
    }
  }

  shouldScrollViewPager(evt, gestureState) {
    if (gestureState.numberActiveTouches > 1) {
      return false;
    }
    const viewTransformer = this.getCurrentImageTransformer();
    if (!viewTransformer) {
      return true;
    }
    const space = viewTransformer.getAvailableTranslateSpace();
    if (!space) {
      return true;
    }
    const dx = gestureState.moveX - gestureState.previousMoveX;

    if (dx > 0 && space.left <= 0 && this.currentPage > 0) {
      return true;
    }
    if (dx < 0 && space.right <= 0 && this.currentPage < this.pageCount - 1) {
      return true;
    }
    return false;
  }

  activeImageResponder(evt, gestureState) {
    if (this.activeResponder !== this.imageResponder) {
      if (this.activeResponder === this.viewPagerResponder) {
        this.viewPagerResponder.onEnd(evt, gestureState, true); //pass true to disable ViewPager settle
      }
      this.activeResponder = this.imageResponder;
      this.imageResponder.onStart(evt, gestureState);
    }
  }

  activeViewPagerResponder(evt, gestureState) {
    if (this.activeResponder !== this.viewPagerResponder) {
      if (this.activeResponder === this.imageResponder) {
        this.imageResponder.onEnd(evt, gestureState);
      }
      this.activeResponder = this.viewPagerResponder;
      this.viewPagerResponder.onStart(evt, gestureState)
    }
  }

  getImageTransformer(page) {
    if (page >= 0 && page < this.pageCount) {
      let ref = this.imageRefs.get(page + '');
      if (ref) {
        return ref.getViewTransformerInstance();
      }
    }
  }

  getCurrentImageTransformer() {
    // console.warn('getImageTransformer...',this.currentPage,this.imageRefs);
    return this.getImageTransformer(this.currentPage);
  }

  getViewPagerInstance() {
    var instance=this.refs['galleryViewPager'];
    if (!instance) {
      // console.warn('galleryVadfasdfiewPager is null...');
      return;
    }
    return this.refs['galleryViewPager'];
  }

  render() {
    let gestureResponder = this.gestureResponder;

    let images = this.props.images;
    if (!images) {
      images = [];
    }
    this.pageCount = images.length;

    if (this.pageCount <= 0) {
      gestureResponder = {};
    }

    // console.warn('render Gallery...',this.pageCount,this.currentPage);
    // console.warn('ViewPager...',this.props.index,images.length);
    return (
      <ViewPager
        {...this.props}
        ref='galleryViewPager'
        scrollEnabled={false}
        initialPage={this.props.index}
        renderPage={this._renderPage.bind(this)}
        pageDataArray={images}
        {...gestureResponder}
        onPageSelected={this.onPageSelected.bind(this)}
        onPageScrollStateChanged={this.onPageScrollStateChanged.bind(this)}
        onPageScroll={this.onPageScroll.bind(this)}
      />
    );
  }

  onPageSelected(page) {
    // console.warn('onPageSelected...',page);
    this.currentPage = page;
    this.props.onPageSelected && this.props.onPageSelected(page);

    this.props.onPageChanged(page);
  }

  onPageScrollStateChanged(state) {
    if (state === 'idle') {
      this.resetHistoryImageTransform();
    }
    this.props.onPageScrollStateChanged && this.props.onPageScrollStateChanged(state);
  }

  onPageScroll(e) {
    this.props.onPageScroll && this.props.onPageScroll(e);
  }
  _renderText(context)
  {
    if (context) {
      return (
        <View style={styles.bottom}>
          <Text style={{fontSize:15,color:'white'}} >
            {context}
          </Text>
        </View>
      );
    }
  }
  _renderPage(pageData, pageId, layout) {
    var { onViewTransformed, onTransformGestureReleased, ...other} = this.props;
    var context=this.props.texts[pageId];

    var {width} = Dimensions.get('window');
    var imageWidth = width;
    var imageHeight = parseInt(imageWidth * 2 / 3);

    return (
      <View style={{flex:1,backgroundColor:'black',justifyContent:'center'}}
        >
        <NetworkImage
          cusRef={((ref) => {
             this.imageRefs.set(pageId, ref);
          }).bind(this)}
          other={other}
          resizeMode={'cover'}
          width={1024}
          height={768}
          zoomAble={true}
          useOrigin={true}
          defaultSource = {require('../../images/building_default/building.png')}
          thumbImageInfo={this.props.thumbImageInfo}
          render={pageId===String(this.props.index)}
          name={pageData}>
        </NetworkImage>

        {this._renderText(context)}
      </View>
    );
  }

  resetHistoryImageTransform() {
    let transformer = this.getImageTransformer(this.currentPage + 1);
    if (transformer) {
      transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
    }

    transformer = this.getImageTransformer(this.currentPage - 1);
    if (transformer) {
      transformer.forceUpdateTransform({scale: 1, translateX: 0, translateY: 0});
    }
  }
  resetCurrIndex(index)
  {
    // console.warn('resetCurrIndex...',index);
    this.currentPage=index;
    this.getViewPagerInstance().setPage(index,true);
  }
}

Gallery.propTypes = {
  images: PropTypes.array,
  thumbImageInfo:PropTypes.object,
  // initialPage: PropTypes.number,
  pageMargin: PropTypes.number,
  onPageSelected: PropTypes.func,
  onPageScrollStateChanged: PropTypes.func,
  onPageScroll: PropTypes.func,

  onSingleTapConfirmed: PropTypes.func,
  onGalleryStateChanged: PropTypes.func,
  renderPage:PropTypes.func,
  onPageChanged:PropTypes.func,
  index:PropTypes.number,
  datas:PropTypes.array,
  texts:PropTypes.array,
}

var styles = StyleSheet.create({
  rowStyle: {
    // flex:1,
    justifyContent: 'center',
    // padding: 10,
    // marginTop:5,
    // marginLeft:3,
    // width: 85,
    // height: 85,
    backgroundColor: 'black',
    alignItems: 'center',
    borderWidth: 1,
    // borderColor: 'gray'
  },
  bottom:{
    zIndex:2,
    position:'absolute',
    bottom:isPhoneX()?32:16,
    left:16,
    right:0,
    flex:1,
    backgroundColor:'rgba(0,0,0,.6)',
    justifyContent:'center',
    paddingHorizontal:10,
    paddingVertical:5,
  },
});
