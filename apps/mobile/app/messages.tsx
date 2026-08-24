import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/lib/theme';
import { DiscoverNav } from '@/components/DiscoverNav';

type ViewName = 'inbox' | 'request' | 'thread' | 'actions' | 'document' | 'tour' | 'options';
const people = [
  { name: 'Michael Torres', deal: 'West Plano, TX', note: 'Can we schedule a tour this week?', time: '9:31 AM', count: 2 },
  { name: 'Sarah Nguyen', deal: 'Frisco, TX', note: 'Thanks for sharing the documents.', time: '8:45 AM', count: 1 },
  { name: 'Daniel Patel', deal: 'McKinney, TX', note: 'I’m interested in this deal.', time: 'Yesterday', count: 0 },
  { name: 'Ashley Johnson', deal: 'Richardson, TX', note: 'New access request received.', time: 'Yesterday', count: 0 },
];

export default function MessagesScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const initial = (params.view as ViewName) || 'inbox';
  const [view, setView] = useState<ViewName>(initial);
  const [approved, setApproved] = useState(initial !== 'request');
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();
  const goBack = () => view === 'inbox' ? router.back() : setView(view === 'thread' ? 'inbox' : 'thread');

  return <SafeAreaView style={styles.safe} edges={['top']}>
    {view !== 'inbox' && <View style={styles.header}><Pressable onPress={goBack}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.headerTitle}>{titleFor(view)}</Text><View style={{width:28}} /></View>}
    {view === 'inbox' && <Inbox openRequest={() => setView('request')} openThread={() => setView('thread')} />}
    {view === 'request' && <AccessRequest approved={approved} approve={() => { setApproved(true); setView('thread'); }} />}
    {view === 'thread' && <Thread approved={approved} message={message} setMessage={setMessage} openActions={() => setView('actions')} openDeal={() => router.push('/opportunity')} />}
    {view === 'actions' && <Actions open={setView} />}
    {view === 'document' && <ShareDocument done={() => setView('thread')} />}
    {view === 'tour' && <ScheduleTour done={() => setView('thread')} />}
    {view === 'options' && <ConversationOptions done={() => setView('inbox')} />}
    {view === 'inbox' && <View style={{height: 98 + Math.max(insets.bottom, 28)}} />}
    {view === 'inbox' && <DiscoverNav />}
  </SafeAreaView>;
}

function Inbox({openRequest,openThread}:{openRequest:()=>void;openThread:()=>void}) {
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.hero}>Messages</Text>
    <View style={styles.tabs}><Text style={styles.tabActive}>All</Text><Text style={styles.tab}>Access Requests</Text><Text style={styles.tab}>Active Deals</Text></View>
    <View style={styles.search}><Text style={styles.muted}>⌕  Search people or opportunities</Text></View>
    {people.map((p,i)=><Pressable key={p.name} onPress={i===3?openRequest:openThread} style={styles.person}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{p.name.split(' ').map(x=>x[0]).join('')}</Text></View>
      <View style={{flex:1}}><View style={styles.line}><Text style={styles.bold}>{p.name}</Text><Text style={styles.time}>{p.time}</Text></View><Text style={styles.deal}>{p.deal}</Text><Text numberOfLines={1} style={styles.muted}>{p.note}</Text>{i===3&&<Text style={styles.requestTag}>New access request</Text>}</View>
      {!!p.count&&<Text style={styles.count}>{p.count}</Text>}
    </Pressable>)}
    <View style={styles.system}><Text style={styles.gold}>VK</Text><View><Text style={styles.bold}>Vault Key Team</Text><Text style={styles.muted}>Your profile has been verified.</Text></View></View>
  </ScrollView>;
}

function AccessRequest({approved,approve}:{approved:boolean;approve:()=>void}) {
  return <ScrollView contentContainerStyle={styles.page}>
    <DealCard />
    <Text style={styles.section}>Requested by</Text>
    <View style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>MT</Text></View><View><Text style={styles.bold}>Michael Torres</Text><Text style={styles.verified}>✓ Identity verified · Proof of funds verified</Text></View></View>
    <Text style={styles.section}>Optional message</Text><View style={styles.note}><Text style={styles.copy}>I’m interested in this opportunity and would like to review additional details and schedule a tour.</Text></View>
    <View style={styles.info}><Text style={styles.bold}>Access requested</Text><Text style={styles.copy}>⌖ 123 Main St, West Plano, TX 75093</Text><Text style={styles.copy}>▱ Seller Disclosure, Survey, Rent Roll</Text><Text style={styles.copy}>♙ Seller contact: name, phone, email</Text></View>
    <Text style={styles.section}>Approve specific items</Text>
    {['Property address','Documents','Seller contact'].map((x,i)=><View key={x} style={styles.checkRow}><Text style={styles.checkbox}>{i<2?'✓':'□'}</Text><Text style={styles.bold}>{x}</Text></View>)}
    <View style={styles.expiry}><Text style={styles.bold}>Access expires in</Text><Text style={styles.verified}>7 days⌄</Text></View>
    <Pressable style={styles.primary} onPress={approve}><Text style={styles.primaryText}>{approved?'Access Approved':'Approve Access'}</Text></Pressable>
    <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Ask a Question</Text></Pressable>
    <Pressable style={styles.danger}><Text style={styles.dangerText}>Decline</Text></Pressable>
  </ScrollView>;
}

function Thread({approved,message,setMessage,openActions,openDeal}:{approved:boolean;message:string;setMessage:(v:string)=>void;openActions:()=>void;openDeal:()=>void}) {
  return <View style={{flex:1}}><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.threadPerson}><View style={styles.avatar}><Text style={styles.avatarText}>MT</Text></View><View style={{flex:1}}><Text style={styles.bold}>Michael Torres</Text><Text style={styles.verified}>● Verified</Text></View><Pressable onPress={()=>router.push('/messages?view=options')}><Text style={styles.more}>•••</Text></Pressable></View>
    <Pressable onPress={openDeal}><DealCard compact /></Pressable>
    {approved&&<Bubble mine text="Hi Michael! I’ve approved access to the documents and property address." />}
    <Bubble text="Thanks so much! I’ll review the documents and follow up with questions." />
    <Text style={styles.event}>Access approved · Documents shared</Text>
    <Bubble text="Looks good. Can we set up a tour for next week?" />
    <Bubble mine text="Absolutely. I’m available Tuesday or Wednesday afternoon." />
    <Bubble text="Tuesday works for me. Afternoon is perfect." />
    <Pressable style={styles.actionsButton} onPress={openActions}><Text style={styles.secondaryText}>Deal Actions  ›</Text></Pressable>
  </ScrollView>
  <View style={styles.composer}><TextInput value={message} onChangeText={setMessage} placeholder="Message about this opportunity…" placeholderTextColor={colors.muted} style={styles.messageInput}/><Text style={styles.attach}>＋</Text><Pressable onPress={()=>setMessage('')} style={styles.send}><Text style={styles.primaryText}>➤</Text></Pressable></View></View>;
}

function Actions({open}:{open:(v:ViewName)=>void}) {
  const actions:[string,ViewName|null][]=[['Schedule a Tour','tour'],['Share a Document','document'],['Request Proof of Funds',null],['Submit / Review Offer',null],['Change Access',null],['Mark Deal Closed',null],['Report or Block','options']];
  return <ScrollView contentContainerStyle={styles.page}><DealCard compact/><Text style={styles.hero}>Deal actions</Text>{actions.map(([x,v])=><Pressable key={x} onPress={()=>v&&open(v)} style={styles.actionRow}><Text style={styles.actionIcon}>◇</Text><Text style={styles.bold}>{x}</Text><Text style={styles.chevron}>›</Text></Pressable>)}</ScrollView>;
}

function ShareDocument({done}:{done:()=>void}) {
  const [selected,setSelected]=useState('Seller Disclosure');
  return <ScrollView contentContainerStyle={styles.page}><DealCard compact/><Text style={styles.section}>Select a document</Text>{['Seller Disclosure','Survey','Inspection Report','Rent Roll','Other'].map(x=><Pressable key={x} onPress={()=>setSelected(x)} style={[styles.actionRow,selected===x&&styles.selected]}><Text style={styles.actionIcon}>▱</Text><Text style={styles.bold}>{x}</Text><Text style={styles.verified}>{selected===x?'✓':''}</Text></Pressable>)}<View style={styles.upload}><Text style={styles.verified}>⇧ Upload new document</Text><Text style={styles.muted}>PDF up to 25 MB</Text></View><Text style={styles.copy}>Only participants in this deal can view shared documents.</Text><Pressable style={styles.primary} onPress={done}><Text style={styles.primaryText}>Send Document</Text></Pressable></ScrollView>;
}

function ScheduleTour({done}:{done:()=>void}) {
  const [time,setTime]=useState('2:30 PM');
  return <ScrollView contentContainerStyle={styles.page}><DealCard compact/><Text style={styles.section}>Select a date</Text><View style={styles.calendar}><Text style={styles.bold}>August 2026</Text><Text style={styles.days}>S   M   T   W   T   F   S</Text><Text style={styles.dates}>9   10   11   12   13   14   15</Text><Text style={styles.dates}>16   17   ●18   19   20   21   22</Text></View><Text style={styles.section}>Available times</Text><View style={styles.grid}>{['10:00 AM','11:30 AM','2:30 PM','4:00 PM','5:30 PM'].map(x=><Pressable key={x} onPress={()=>setTime(x)} style={[styles.timeButton,time===x&&styles.timeActive]}><Text style={time===x?styles.primaryText:styles.bold}>{x}</Text></Pressable>)}</View><Text style={styles.section}>Tour type</Text><View style={styles.grid}><View style={[styles.timeButton,styles.selected]}><Text style={styles.bold}>⌖ In Person</Text></View><View style={styles.timeButton}><Text style={styles.bold}>Video</Text></View></View><View style={styles.note}><Text style={styles.copy}>Please meet at the front door. Feel free to bring your agent.</Text></View><Text style={styles.confirmation}>Tue, Aug 18 · {time}</Text><Pressable style={styles.primary} onPress={done}><Text style={styles.primaryText}>Send Tour Request</Text></Pressable></ScrollView>;
}

function ConversationOptions({done}:{done:()=>void}) {
 return <ScrollView contentContainerStyle={styles.page}>{['Mute notifications','Archive conversation','Mark as unread','Report conversation','Block user'].map(x=><View key={x} style={styles.actionRow}><Text style={styles.actionIcon}>◇</Text><Text style={styles.bold}>{x}</Text></View>)}<Text style={styles.section}>Delete conversation?</Text><Text style={styles.copy}>This removes the conversation from your account. Shared deal records may be retained for security and compliance.</Text><Pressable style={styles.danger} onPress={done}><Text style={styles.dangerText}>Delete Conversation</Text></Pressable></ScrollView>;
}

function DealCard({compact=false}:{compact?:boolean}) { return <View style={[styles.dealCard,compact&&styles.compact]}><View style={styles.dealPhoto}><Text style={styles.gold}>VK</Text></View><View style={{flex:1}}><Text style={styles.bold}>West Plano, TX</Text><Text style={styles.deal}>Asking $610,000</Text><Text style={styles.verified}>20% below market</Text></View><Text style={styles.secondaryText}>View Deal</Text></View> }
function Bubble({text,mine=false}:{text:string;mine?:boolean}) { return <View style={[styles.bubble,mine&&styles.mine]}><Text style={mine?styles.mineText:styles.copy}>{text}</Text></View> }
function titleFor(v:ViewName){return ({request:'Access request',thread:'Deal conversation',actions:'Deal actions',document:'Share a document',tour:'Schedule a tour',options:'Conversation options',inbox:'Messages'} as Record<ViewName,string>)[v]}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.ivory},header:{height:54,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:colors.border},back:{fontSize:34,color:colors.ink},headerTitle:{fontFamily:'serif',fontSize:20,color:colors.ink},page:{padding:20,paddingBottom:36,gap:12},hero:{fontFamily:'serif',fontSize:29,color:colors.ink,marginBottom:4},section:{fontFamily:'serif',fontSize:19,color:colors.ink,marginTop:9},tabs:{height:42,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,flexDirection:'row',alignItems:'center',padding:3},tab:{flex:1,textAlign:'center',fontSize:10,color:colors.muted},tabActive:{flex:1,textAlign:'center',paddingVertical:10,borderRadius:8,overflow:'hidden',backgroundColor:colors.emerald,color:colors.white,fontSize:10,fontWeight:'800'},search:{height:46,justifyContent:'center',paddingHorizontal:14,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm},person:{minHeight:82,flexDirection:'row',alignItems:'center',gap:11,paddingVertical:11,borderBottomWidth:1,borderColor:colors.border},avatar:{width:45,height:45,borderRadius:23,backgroundColor:colors.emeraldDark,alignItems:'center',justifyContent:'center'},avatarText:{color:colors.gold,fontWeight:'900'},line:{flexDirection:'row',justifyContent:'space-between'},bold:{color:colors.ink,fontWeight:'800',fontSize:12},time:{fontSize:9,color:colors.muted},deal:{fontSize:10,color:colors.muted,marginVertical:3},muted:{fontSize:11,color:colors.muted},count:{width:22,height:22,borderRadius:11,textAlign:'center',paddingTop:3,overflow:'hidden',backgroundColor:colors.emerald,color:colors.white,fontSize:10,fontWeight:'800'},requestTag:{fontSize:9,color:colors.emerald,fontWeight:'800',marginTop:5},system:{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:colors.white,borderRadius:radius.md,borderWidth:1,borderColor:colors.border},gold:{color:colors.gold,fontWeight:'900',fontSize:18},dealCard:{minHeight:104,padding:12,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,flexDirection:'row',alignItems:'center',gap:11},compact:{minHeight:82},dealPhoto:{width:76,height:66,borderRadius:radius.sm,backgroundColor:colors.emeraldDark,alignItems:'center',justifyContent:'center'},identity:{flexDirection:'row',gap:12,alignItems:'center'},verified:{fontSize:10,color:colors.emerald,fontWeight:'800'},note:{padding:14,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm},copy:{fontSize:12,lineHeight:19,color:colors.ink},info:{gap:12,padding:16,backgroundColor:'#EAF4F0',borderRadius:radius.md},checkRow:{height:38,flexDirection:'row',alignItems:'center',gap:10},checkbox:{fontSize:19,color:colors.emerald},expiry:{flexDirection:'row',justifyContent:'space-between',padding:14,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm},primary:{minHeight:52,borderRadius:radius.sm,backgroundColor:colors.emerald,alignItems:'center',justifyContent:'center',marginTop:8},primaryText:{color:colors.white,fontWeight:'800'},secondary:{minHeight:48,borderRadius:radius.sm,borderWidth:1,borderColor:colors.emerald,alignItems:'center',justifyContent:'center'},secondaryText:{color:colors.emerald,fontWeight:'800',fontSize:11},danger:{minHeight:46,alignItems:'center',justifyContent:'center'},dangerText:{color:'#B42318',fontWeight:'800'},threadPerson:{flexDirection:'row',alignItems:'center',gap:10},more:{fontSize:18,color:colors.ink},bubble:{alignSelf:'flex-start',maxWidth:'82%',padding:13,borderRadius:14,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border},mine:{alignSelf:'flex-end',backgroundColor:colors.emerald},mineText:{color:colors.white,fontSize:12,lineHeight:18},event:{alignSelf:'center',fontSize:9,color:colors.muted,paddingVertical:8},actionsButton:{alignSelf:'flex-start',padding:12,borderWidth:1,borderColor:colors.emerald,borderRadius:radius.sm},composer:{padding:10,flexDirection:'row',alignItems:'center',gap:7,borderTopWidth:1,borderColor:colors.border,backgroundColor:colors.ivory},messageInput:{flex:1,height:46,paddingHorizontal:13,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:colors.white,color:colors.ink},attach:{fontSize:22,color:colors.emerald},send:{width:43,height:43,borderRadius:22,backgroundColor:colors.emerald,alignItems:'center',justifyContent:'center'},actionRow:{height:58,paddingHorizontal:14,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,flexDirection:'row',alignItems:'center',gap:12},actionIcon:{color:colors.emerald,fontSize:18},chevron:{marginLeft:'auto',color:colors.muted,fontSize:22},selected:{borderColor:colors.emerald,backgroundColor:'#EAF4F0'},upload:{height:120,borderWidth:1,borderStyle:'dashed',borderColor:colors.emerald,borderRadius:radius.md,alignItems:'center',justifyContent:'center',gap:5,backgroundColor:colors.white},calendar:{height:190,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:colors.white,padding:18,alignItems:'center',gap:18},days:{color:colors.muted,fontSize:11,letterSpacing:6},dates:{color:colors.ink,fontSize:12,letterSpacing:6},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},timeButton:{width:'31%',height:44,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,alignItems:'center',justifyContent:'center'},timeActive:{backgroundColor:colors.emerald,borderColor:colors.emerald},confirmation:{textAlign:'center',fontSize:15,fontWeight:'900',color:colors.ink,marginVertical:10}
});