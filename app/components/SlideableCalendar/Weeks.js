import React from 'react';
import {
  View,
  Text,
  Dimensions
} from 'react-native';
import Colors from "../../../../../app/utils/const/Colors";
const width = Dimensions.get('window').width;
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export default ({ isChinese, weekStartsOn }) => {
  const week_localized = isChinese ? WEEK : WEEK_en;
  const weekStartsOnMinnor = weekStartsOn % 7;
  const weekTranformed = [
    ...week_localized.slice(weekStartsOnMinnor),
    ...week_localized.slice(0, weekStartsOnMinnor),
  ];
  return (
    <View style={{
      width,
      height: 20,
      flexDirection: 'row',
    }}>
      {weekTranformed.map(day =>
        <View style={{
          flex: 1,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }} key={day}>
          <Text style={{
            color: Colors.seTextInverse,
            fontSize: 14,
          }}>{day}</Text>
        </View>
      )}
    </View>
  );
}
