import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';

const prompts=['Is 20% below market accurate?','What costs should I consider?','Compare nearby sales','Estimate monthly payment'];
export default function DealAssistantScreen(){
 const [question,setQuestion]=useState(''); const [messages,setMessages]=useState<string[]>([]);
 const ask=(value:string)=>{if(value.trim()){setMessages([...messages,value.trim()]);setQuestion('')}};
 return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.title}>Deal Assistant</Text><Text style={styles.online}>Analyzing: West Plano opportunity</Text></View><Text style={styles.spark}>✦</Text></View>
 <ScrollView contentContainerStyle={styles.body}><Text style={styles.intro}>Ask me to explain the numbers, compare this deal, or build a quick estimate.</Text>
 <View style={styles.prompts}>{prompts.map(p=><Pressable key={p} onPress={()=>ask(p)} style={styles.prompt}><Text style={styles.promptText}>{p}</Text></Pressable>)}</View>
 <View style={styles.answer}><Text style={styles.answerTitle}>Vault Key analysis</Text><Text style={styles.answerText}>Based on the independent valuation and available comparable sales, the estimated market value is $760,000. The 20% discount appears reasonable, but verify inspection, title, repair costs, and financing before making an offer.</Text><Text style={styles.disclaimer}>Estimates are informational. Verify before making an offer.</Text></View>
 {messages.map((message,index)=><View key={index} style={styles.userMessage}><Text style={styles.userText}>{message}</Text></View>)}</ScrollView>
 <View style={styles.composer}><TextInput value={question} onChangeText={setQuestion} placeholder="Ask about this deal…" style={styles.input}/><Pressable onPress={()=>ask(question)} style={styles.send}><Text style={styles.sendText}>➤</Text></Pressable></View>
 </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.ivory},header:{height:72,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderColor:colors.border},back:{fontSize:36},title:{fontFamily:'serif',fontSize:20},online:{fontSize:9,color:colors.emerald,marginTop:2},spark:{marginLeft:'auto',color:colors.gold,fontSize:20},body:{padding:20,paddingBottom:30},intro:{fontSize:12,lineHeight:19,color:colors.muted},prompts:{gap:8,marginTop:15},prompt:{borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:12,backgroundColor:colors.white},promptText:{color:colors.emerald,fontSize:11,fontWeight:'600'},answer:{marginTop:18,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:15},answerTitle:{fontWeight:'700',fontSize:13},answerText:{fontSize:11,lineHeight:18,color:colors.muted,marginTop:8},disclaimer:{fontSize:9,color:colors.muted,marginTop:12},userMessage:{alignSelf:'flex-end',backgroundColor:colors.emerald,padding:11,borderRadius:radius.md,marginTop:10,maxWidth:'82%'},userText:{color:colors.white,fontSize:11},composer:{padding:14,borderTopWidth:1,borderColor:colors.border,flexDirection:'row',gap:8,backgroundColor:colors.ivory},input:{flex:1,height:46,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:colors.white,paddingHorizontal:12},send:{width:46,height:46,borderRadius:radius.sm,backgroundColor:colors.emerald,alignItems:'center',justifyContent:'center'},sendText:{color:colors.white}});
