import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { subscribeToThemeChanges, getCodecTheme } from '../lib/theme';

interface BudgetStats {
  requestCount: number;
  tokenCount: number;
  estimatedSpendUSD: number;
  windowStart: number;
  sessionStart: number;
}

interface BudgetConfig {
  requestsPerWindow: number;
  windowMs: number;
  maxTokensPerSession: number;
  monthlyBudgetUSD: number;
}

interface BudgetWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  budgetUsedPercent: number;
  tokenUsedPercent: number;
}

interface BudgetIndicatorProps {
  sessionId?: string;
  onToggle?: () => void;
  compact?: boolean;
  refreshTrigger?: number; // Trigger refresh when this changes
}

export const BudgetIndicator: React.FC<BudgetIndicatorProps> = ({ 
  sessionId, 
  onToggle,
  compact = true,
  refreshTrigger = 0
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [budgetData, setBudgetData] = useState<{
    usage: BudgetStats;
    config: BudgetConfig;
    warning: BudgetWarning | null;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  // Fetch budget data
  const fetchBudgetData = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';
      const url = sessionId ? `${apiUrl}/budget?sessionId=${sessionId}` : `${apiUrl}/budget`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Budget API error: ${response.status}`);
      }
      
      const data = await response.json();
      setBudgetData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
      console.warn('[BUDGET INDICATOR] Error fetching budget data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when sessionId or refreshTrigger changes
  useEffect(() => {
    fetchBudgetData();
  }, [sessionId, refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBudgetData, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: currentTheme.colors.background,
      borderColor: currentTheme.colors.primary,
      borderWidth: 1,
      borderRadius: 4,
      padding: compact ? 4 : 8,
      minWidth: compact ? 80 : 120,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: currentTheme.colors.primary,
      fontSize: compact ? 10 : 12,
      fontFamily: 'VT323',
      fontWeight: 'bold',
    },
    value: {
      color: currentTheme.colors.text,
      fontSize: compact ? 9 : 11,
      fontFamily: 'VT323',
    },
    warningText: {
      fontSize: compact ? 8 : 10,
      fontFamily: 'VT323',
      marginTop: 2,
    },
    expandedContent: {
      marginTop: 6,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.secondary,
    },
    stat: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 1,
    },
    statLabel: {
      color: currentTheme.colors.text,
      fontSize: 9,
      fontFamily: 'VT323',
      opacity: 0.8,
    },
    statValue: {
      color: currentTheme.colors.primary,
      fontSize: 9,
      fontFamily: 'VT323',
    }
  });

  const getWarningColor = (level: string | undefined) => {
    switch (level) {
      case 'critical': return '#FF4444';
      case 'warning': return '#FFA500';
      case 'info': return currentTheme.colors.secondary;
      default: return currentTheme.colors.text;
    }
  };

  if (error && !compact) {
    return (
      <View style={dynamicStyles.container}>
        <Text style={[dynamicStyles.title, { color: '#FF4444' }]}>BUDGET ERROR</Text>
        <Text style={[dynamicStyles.value, { color: '#FF4444', fontSize: 8 }]}>
          {error.slice(0, 20)}...
        </Text>
      </View>
    );
  }

  if (isLoading && !budgetData) {
    return (
      <View style={dynamicStyles.container}>
        <Text style={dynamicStyles.title}>BUDGET</Text>
        <Text style={dynamicStyles.value}>Loading...</Text>
      </View>
    );
  }

  if (!budgetData) {
    return null;
  }

  const { usage, config, warning } = budgetData;
  const budgetUsedPercent = (usage.estimatedSpendUSD / config.monthlyBudgetUSD) * 100;
  const tokensUsedPercent = (usage.tokenCount / config.maxTokensPerSession) * 100;

  return (
    <TouchableOpacity 
      style={dynamicStyles.container}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>
          {compact ? 'BGT' : 'BUDGET'}
        </Text>
        <Text style={dynamicStyles.value}>
          ${usage.estimatedSpendUSD.toFixed(3)}
        </Text>
      </View>
      
      {warning && (
        <Text style={[
          dynamicStyles.warningText, 
          { color: getWarningColor(warning.level) }
        ]}>
          {compact ? 
            `${Math.round(budgetUsedPercent)}%` : 
            warning.message.slice(0, 30) + (warning.message.length > 30 ? '...' : '')
          }
        </Text>
      )}
      
      {isExpanded && (
        <View style={dynamicStyles.expandedContent}>
          <View style={dynamicStyles.stat}>
            <Text style={dynamicStyles.statLabel}>Requests:</Text>
            <Text style={dynamicStyles.statValue}>
              {usage.requestCount}/{config.requestsPerWindow}
            </Text>
          </View>
          <View style={dynamicStyles.stat}>
            <Text style={dynamicStyles.statLabel}>Tokens:</Text>
            <Text style={dynamicStyles.statValue}>
              {usage.tokenCount.toLocaleString()}/{config.maxTokensPerSession.toLocaleString()}
            </Text>
          </View>
          <View style={dynamicStyles.stat}>
            <Text style={dynamicStyles.statLabel}>Budget:</Text>
            <Text style={dynamicStyles.statValue}>
              ${usage.estimatedSpendUSD.toFixed(3)}/${config.monthlyBudgetUSD}
            </Text>
          </View>
          <View style={dynamicStyles.stat}>
            <Text style={dynamicStyles.statLabel}>Usage:</Text>
            <Text style={dynamicStyles.statValue}>
              {Math.round(budgetUsedPercent)}% / {Math.round(tokensUsedPercent)}%
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
