import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';

const photos = [
  require('../assets/west-plano.jpg'),
  require('../assets/west-plano.jpg'),
  require('../assets/west-plano.jpg'),
  require('../assets/west-plano.jpg'),
  require('../assets/west-plano.jpg'),
  require('../assets/west-plano.jpg'),
];

export default function GalleryScreen() {
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.title}>Property photos</Text><Text style={styles.sub}>18 photos · documents</Text></View><Text style={styles.count}>18</Text></View>
    <View style={styles.tabs}>{['All','Interior','Exterior','Documents'].map((tab,index)=><View key={tab} style={[styles.tab,index===0&&styles.active]}><Text style={[styles.tabText,index===0&&styles.activeText]}>{tab}</Text></View>)}</View>
    <ScrollView contentContainerStyle={styles.grid}>{photos.map((photo,index)=><Image key={index} source={photo} style={[styles.photo,index===0&&styles.hero]} />)}</ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.ivory},header:{height:74,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:14},back:{fontSize:36},title:{fontFamily:'serif',fontSize:22,color:colors.ink},sub:{fontSize:10,color:colors.muted},count:{marginLeft:'auto',color:colors.emerald,fontWeight:'700'},tabs:{flexDirection:'row',paddingHorizontal:18,gap:7,paddingBottom:12},tab:{paddingHorizontal:13,paddingVertical:8,borderWidth:1,borderColor:colors.border,borderRadius:radius.pill},active:{backgroundColor:colors.emerald,borderColor:colors.emerald},tabText:{fontSize:10,color:colors.muted},activeText:{color:colors.white,fontWeight:'700'},grid:{padding:18,paddingTop:0,flexDirection:'row',flexWrap:'wrap',gap:8},photo:{width:'48.7%',height:140,borderRadius:radius.sm},hero:{width:'100%',height:225}});
