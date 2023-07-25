import {Platform,Image} from 'react-native';
import RNFS, { DocumentDirectoryPath,PicturesDirectoryPath } from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'react-native-fetch-blob';
const saveDocumentPath = Platform.OS === 'ios' ? DocumentDirectoryPath : RNFS.ExternalDirectoryPath;
//定义图片压缩缓存的目录，这里和图片下载的缓存目录保持一致
const IMG_COMPRESS_PATH=`${saveDocumentPath}/img_compress_path/`;

//定义图片的压缩尺寸,长或宽不能超过这个尺寸
const SIZE_OF_COMPRESS=1024;

const COMPRESS_TYPE_OF_IMG='JPEG';

//图片压缩质量，最大100
const QUALITY_OF_COMPRESS=90;

//如果图片文件大小 小于 定义值，不压缩
const MAX_SIZE_OF_NO_COMPRESS=1024*512;//512k

export function compressImages(imgs,callback) {
	let doCompress=(imgs,ret)=>{
		if(imgs&&imgs.length>0) {
			let item=imgs.pop();
			//压缩之前，需要先判断被压缩的图片是满足压缩要求：如果被压缩的图片本来就是小图，不用压缩
			if (item.width > SIZE_OF_COMPRESS || item.height > SIZE_OF_COMPRESS) {
				ImageResizer.createResizedImage(item.uri, SIZE_OF_COMPRESS, SIZE_OF_COMPRESS, COMPRESS_TYPE_OF_IMG,
					QUALITY_OF_COMPRESS, 0, IMG_COMPRESS_PATH, false)
					.then(response => {
						//添加到返回集合
						ret.push({filename:response.name,...response});
						console.warn('response', response);
						doCompress(imgs,ret);
					})
					.catch(err => {
						console.warn('图片压缩失败', err, item);
						doCompress(imgs,ret);
					});
			} else {
				//不需要压缩
				ret.push(item);
				doCompress(imgs,ret);
			}
		}else{
			callback(ret);
		}
	}
	//第一步，检查缓存目录是否存在
	RNFS.exists(IMG_COMPRESS_PATH).then(res=>{
		if(res){
			return doCompress([].concat(imgs),[]);
		}else{
			RNFetchBlob.fs.mkdir(IMG_COMPRESS_PATH)
				.then(()=>doCompress([].concat(imgs),[]))
				.catch(err=>{
					console.warn('创建图片压缩目录失败:',err);
					callback(null);
				});
		}
	}).catch(err=>{
		//创建目录，再执行
		RNFetchBlob.fs.mkidr(IMG_COMPRESS_PATH)
			.then(()=>{
				console.warn(`创建目录[${IMG_COMPRESS_PATH}]成功`);
				doCompress([].concat(imgs),[]);
			})
			.catch(err=>{
				console.warn('创建图片压缩目录失败:',err);
				callback(null);
			});
	});
}

/**
 * 删除压缩图片问
 * 在工单同步完成后调用
 */
export function clearCompressImages(){
	// console.warn('执行删除压缩目录操作')
  RNFS.exists(IMG_COMPRESS_PATH).then(exist=>{
    if(exist)
      RNFS.unlink(IMG_COMPRESS_PATH)
  });
}
