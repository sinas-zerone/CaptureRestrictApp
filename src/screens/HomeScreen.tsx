/**
 * HomeScreen — Example screen demonstrating security & performance features
 *
 * Features:
 * - Wrapped with SecureScreenWrapper for capture prevention
 * - Uses useScreenLoadTrace for performance monitoring
 * - Displays performance report for debugging (dev only)
 * - React.memo'd to prevent unnecessary re-renders
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SecureScreenWrapper } from '@features/security/components/SecureScreenWrapper';
import { useScreenLoadTrace } from '@core/monitoring/useScreenLoadTrace';
import {
  PerformanceTracer,
  PerformanceReport,
} from '@core/monitoring/PerformanceTracer';
import { TRACE_NAMES } from '@core/constants';

function HomeScreenInner(): React.JSX.Element {
  // Track how long this screen takes to become interactive
  useScreenLoadTrace('HomeScreen');

  const [perfReport, setPerfReport] = useState<PerformanceReport | null>(null);

  // Demonstrate background task tracing
  const handleRunBackgroundTask = useCallback(async () => {
    const traceName = `${TRACE_NAMES.BACKGROUND_TASK}:sampleTask`;
    PerformanceTracer.startTrace(traceName);

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 500));

    PerformanceTracer.stopTrace(traceName);
    setPerfReport(PerformanceTracer.getReport());
  }, []);

  // Show current performance report
  const handleViewReport = useCallback(() => {
    setPerfReport(PerformanceTracer.getReport());
  }, []);

  return (
    <SecureScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status Section */}
        <View style={styles.card}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusText}>Screen Protection Active</Text>
          </View>
          <Text style={styles.cardDescription}>
            Screenshots and screen recordings are blocked on this screen.
            On Android, captures will appear black. On iOS, a privacy overlay
            is shown when recording is detected.
          </Text>
        </View>

        {/* Security Features */}
        <Text style={styles.sectionTitle}>Security Features</Text>
        <View style={styles.featureList}>
          <FeatureItem
            icon="🛡️"
            title="FLAG_SECURE (Android)"
            description="OS-level capture blocking"
          />
          <FeatureItem
            icon="🔍"
            title="Capture Detection (iOS)"
            description="Detects recording & shows overlay"
          />
          <FeatureItem
            icon="🔄"
            title="Lifecycle Aware"
            description="Re-enables on app foreground"
          />
          <FeatureItem
            icon="📊"
            title="Performance Traced"
            description="Screen load time monitored"
          />
        </View>

        {/* Performance Monitoring Section */}
        <Text style={styles.sectionTitle}>Performance Monitor</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRunBackgroundTask}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Run Sample Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleViewReport}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>View Report</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Report Display */}
        {perfReport && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Performance Report</Text>
            <Text style={styles.reportStat}>
              Total Traces: {perfReport.summary.totalTraces}
            </Text>
            <Text style={styles.reportStat}>
              Avg Duration: {perfReport.summary.averageDuration.toFixed(2)}ms
            </Text>
            {perfReport.summary.slowestTrace && (
              <Text style={styles.reportStat}>
                Slowest: {perfReport.summary.slowestTrace.name} (
                {perfReport.summary.slowestTrace.duration?.toFixed(2)}ms)
              </Text>
            )}
            {perfReport.traces.slice(-5).map((trace, index) => (
              <View key={`${trace.name}-${index}`} style={styles.traceItem}>
                <Text style={styles.traceName} numberOfLines={1}>
                  {trace.name}
                </Text>
                <Text style={styles.traceDuration}>
                  {trace.duration?.toFixed(1)}ms
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SecureScreenWrapper>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem = React.memo(function FeatureItem({
  icon,
  title,
  description,
}: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Memoized export
// ---------------------------------------------------------------------------

export const HomeScreen = React.memo(HomeScreenInner);
HomeScreen.displayName = 'HomeScreen';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    fontSize: 12,
    color: '#22C55E',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  cardDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#6366F1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  reportStat: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
  },
  traceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 4,
  },
  traceName: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E1',
    marginRight: 12,
  },
  traceDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
