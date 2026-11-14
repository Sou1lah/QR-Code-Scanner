import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, colors, PageHeader, Screen, VerdictBadge } from '@/components/ui'
import { useAppState } from '@/context/AppContext'
import type { HistoryItem } from '@/types/api'

export default function HistoryScreen() {
  const { history, clearHistory } = useAppState()

  const confirmClear = () => {
    Alert.alert('Clear scan history?', 'This removes all saved QR audit records from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearHistory },
    ])
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          title="History"
          subtitle="Scanned QR payload audit records"
          action={
            history.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={confirmClear} hitSlop={8}>
                <Text style={styles.clearButton}>Clear all</Text>
              </Pressable>
            ) : undefined
          }
        />
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◷</Text>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyMessage}>Your scanned payloads will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((item) => <HistoryCard key={item.id} item={item} />)}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyCopy}>
        <Text style={styles.time}>{relativeTime(item.timestamp)}</Text>
        <Text numberOfLines={2} style={styles.payload}>{item.raw}</Text>
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
  clearButton: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
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
    color: colors.muted,
    fontSize: 10,
  },
  payload: {
    color: colors.text,
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
    color: colors.muted,
    fontSize: 36,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 12,
  },
})
