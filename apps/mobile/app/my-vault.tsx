import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiscoverNav } from '@/components/DiscoverNav';
import { colors, radius } from '@/lib/theme';
import { money, opportunities, type Opportunity } from '@/lib/opportunities';

const propertyImage = require('../assets/west-plano.jpg');
const tabs = ['Saved', 'Requested', 'Unlocked', 'My Listings'] as const;
type VaultTab = typeof tabs[number];

const records: Record<VaultTab, Opportunity[]> = {
  Saved: opportunities,
  Requested: opportunities.slice(0, 2),
  Unlocked: opportunities.slice(1, 4),
  'My Listings': opportunities.slice(3),
};

export default function MyVaultScreen() {
  const [tab, setTab] = useState<VaultTab>('Saved');
  const [selected, setSelected] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const items = records[tab];

  const compared = useMemo(
    () => opportunities.filter((item) => selected.includes(item.id)),
    [selected],
  );

  const toggleSelection = (id: string) => {
    setShowComparison(false);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PRIVATE OPPORTUNITIES</Text>
          <Text style={styles.title}>My Vault</Text>
          <Text style={styles.subtitle}>Save, track, compare, and manage your deals.</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable
            key={item}
            style={[styles.tab, tab === item && styles.activeTab]}
            onPress={() => {
              setTab(item);
              setSelected([]);
              setShowComparison(false);
            }}
          >
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toolbar}>
          <Text style={styles.count}>{items.length} {items.length === 1 ? 'opportunity' : 'opportunities'}</Text>
          {tab === 'Saved' ? <Text style={styles.hint}>Select up to 3 to compare</Text> : null}
        </View>

        {tab === 'Saved' && selected.length > 0 ? (
          <View style={styles.compareBar}>
            <Text style={styles.compareCount}>{selected.length}/3 selected</Text>
            <Pressable
              disabled={selected.length < 2}
              style={[styles.compareButton, selected.length < 2 && styles.disabled]}
              onPress={() => setShowComparison(true)}
            >
              <Text style={styles.compareButtonText}>Compare</Text>
            </Pressable>
          </View>
        ) : null}

        {showComparison ? (
          <View style={styles.comparison}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.sectionTitle}>Deal comparison</Text>
              <Pressable onPress={() => setShowComparison(false)}><Text style={styles.close}>Close</Text></Pressable>
            </View>
            {compared.map((item) => (
              <View key={item.id} style={styles.compareRow}>
                <View style={styles.compareName}>
                  <Text style={styles.compareTitle}>{item.location}</Text>
                  <Text style={styles.meta}>{item.subtype}</Text>
                </View>
                <View>
                  <Text style={styles.compareValue}>{money(item.askingPrice)}</Text>
                  <Text style={styles.discount}>{item.discount}% below value</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/opportunity?id=${item.id}`)}>
              <Image source={propertyImage} style={styles.image} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.assetPill}><Text style={styles.assetText}>{item.assetClass}</Text></View>
                  {tab === 'Saved' ? (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      onPress={(event) => {
                        event.stopPropagation();
                        toggleSelection(item.id);
                      }}
                      style={[styles.selector, isSelected && styles.selectorActive]}
                    >
                      <Text style={[styles.selectorText, isSelected && styles.selectorTextActive]}>{isSelected ? '✓' : ''}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.status}>{tab === 'My Listings' ? 'LIVE' : tab.toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.location}>{item.location}</Text>
                <Text style={styles.meta}>{item.subtype} · {item.strategy}</Text>
                <Text style={styles.price}>{money(item.askingPrice)}</Text>
                <Text style={styles.discount}>{item.discount}% below value · {money(item.upside)} upside</Text>
              </View>
            </Pressable>
          );
        })}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.sectionTitle}>Nothing here yet</Text>
            <Text style={styles.meta}>Your opportunities will appear here as you use Vault Key.</Text>
          </View>
        ) : null}
      </ScrollView>

      <DiscoverNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.ivory},
  header:{paddingHorizontal:20,paddingTop:14,paddingBottom:15},
  eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.2,color:colors.gold},
  title:{fontSize:34,fontWeight:'800',color:colors.ink,marginTop:3},
  subtitle:{fontSize:14,color:colors.muted,marginTop:4},
  tabs:{marginHorizontal:16,backgroundColor:colors.white,borderRadius:radius.md,padding:4,flexDirection:'row',borderWidth:1,borderColor:colors.border},
  tab:{flex:1,minHeight:42,alignItems:'center',justifyContent:'center',borderRadius:radius.sm,paddingHorizontal:4},
  activeTab:{backgroundColor:colors.emerald},
  tabText:{fontSize:11,fontWeight:'700',color:colors.muted,textAlign:'center'},
  activeTabText:{color:colors.white},
  content:{padding:16,paddingBottom:150,gap:10},
  toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:2},
  count:{fontSize:15,fontWeight:'800',color:colors.ink},
  hint:{fontSize:12,color:colors.muted},
  compareBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#E6F1ED',borderRadius:radius.md,padding:10,borderWidth:1,borderColor:'#B8D8CD'},
  compareCount:{fontSize:13,fontWeight:'700',color:colors.emerald},
  compareButton:{backgroundColor:colors.emerald,borderRadius:radius.sm,paddingHorizontal:18,paddingVertical:10},
  disabled:{opacity:.35},
  compareButtonText:{color:colors.white,fontWeight:'800',fontSize:13},
  comparison:{backgroundColor:colors.emeraldDark,borderRadius:radius.lg,padding:16,gap:10},
  comparisonHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  sectionTitle:{fontSize:18,fontWeight:'800',color:colors.ink},
  close:{color:colors.gold,fontWeight:'800'},
  compareRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.15)'},
  compareName:{flex:1},
  compareTitle:{color:colors.white,fontSize:15,fontWeight:'800'},
  compareValue:{color:colors.white,fontSize:15,fontWeight:'800',textAlign:'right'},
  card:{backgroundColor:colors.white,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,overflow:'hidden',flexDirection:'row',minHeight:132},
  image:{width:116,height:'100%'},
  cardBody:{flex:1,padding:12,justifyContent:'center'},
  cardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5},
  assetPill:{backgroundColor:'#E6F1ED',paddingHorizontal:8,paddingVertical:4,borderRadius:radius.pill},
  assetText:{fontSize:10,fontWeight:'800',color:colors.emerald},
  selector:{width:27,height:27,borderRadius:14,borderWidth:1.5,borderColor:colors.border,alignItems:'center',justifyContent:'center',backgroundColor:colors.white},
  selectorActive:{backgroundColor:colors.emerald,borderColor:colors.emerald},
  selectorText:{fontSize:15,fontWeight:'900',color:colors.muted},
  selectorTextActive:{color:colors.white},
  status:{fontSize:9,fontWeight:'900',color:colors.success},
  location:{fontSize:18,fontWeight:'800',color:colors.ink},
  meta:{fontSize:12,color:colors.muted,marginTop:2},
  price:{fontSize:20,fontWeight:'900',color:colors.ink,marginTop:7},
  discount:{fontSize:12,fontWeight:'800',color:colors.success,marginTop:3},
  empty:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:24,alignItems:'center',gap:6}
});
