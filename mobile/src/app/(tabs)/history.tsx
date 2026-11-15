import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { AppIcon, AppText, Card, colors, PageHeader, Screen, useTabBarSpace, VerdictBadge } from '@/ui'
import { useAppState } from '@/context/AppContext'
import type { HistoryItem } from '@/types/api'

export default function HistoryScreen() {
  const { history, clearHistory } = useAppState()
  const tabBarSpace = useTabBarSpace()

  const confirmClear = () => {
    Alert.alert('Clear scan history?', 'This removes all saved QR audit records from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearHistory },
    ])
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="History"
          subtitle="Scanned QR payload audit records"
          action={
            history.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={confirmClear} hitSlop={8} style={styles.clearButtonWrap}>
                <AppIcon name="trash" size={14} color={colors.danger} />
                <AppText variant="caption" style={styles.clearButton}>Clear all</AppText>
              </Pressable>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <AppIcon name="history" size={44} color={colors.accent} />
            </View>
            <AppText variant="heading" style={styles.emptyTitle}>No scans yet</AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.emptyMessage}>
              Scan QR codes with the camera or gallery to view your audit log.
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const isUrl = /^https?:\/\//i.test(item.raw)
  const isWifi = /^WIFI:/i.test(item.raw)
  const iconName = isUrl ? 'link' : isWifi ? 'wifi' : 'document'

  return (
    <Card style={styles.historyCard}>
      <View style={styles.cardIconWrap}>
        <AppIcon name={iconName} size={18} color={colors.accent} />
      </View>
      <View style={styles.historyCopy}>
        <AppText variant="caption" color={colors.textMuted} style={styles.time}>{relativeTime(item.timestamp)}</AppText>
        <AppText numberOfLines={2} style={styles.payload}>
          {item.raw}
        </AppText>
      </View>
      <VerdictBadge verdict={item.result.verdict} />
    </Card>
  )
}

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  clearButtonWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
  },
  clearButton: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    marginBottom: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
  },
  historyCopy: {
    flex: 1,
    gap: 5,
  },
  time: {
    fontSize: 10,
  },
  payload: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  emptyIcon: {
    marginBottom: 5,
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyMessage: {
    fontSize: 12,
  },
})
