import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { healthCheck } from '@/lib/api';

export const ConnectionDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setDebugInfo('Testing connection...\n');
    
    try {
      // Log environment variables
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';
      setDebugInfo(prev => prev + `API URL: ${apiUrl}\n`);
      
      // Test health endpoint
      setDebugInfo(prev => prev + 'Calling health endpoint...\n');
      const startTime = Date.now();
      
      const result = await healthCheck();
      const endTime = Date.now();
      
      setDebugInfo(prev => prev + `Success! Response time: ${endTime - startTime}ms\n`);
      setDebugInfo(prev => prev + `Response: ${JSON.stringify(result, null, 2)}\n`);
      
    } catch (error) {
      const endTime = Date.now();
      setDebugInfo(prev => prev + `Error: ${error}\n`);
      setDebugInfo(prev => prev + `Error type: ${typeof error}\n`);
      setDebugInfo(prev => prev + `Error name: ${(error as any)?.name}\n`);
      setDebugInfo(prev => prev + `Error message: ${(error as any)?.message}\n`);
    }
    
    setIsLoading(false);
  };

  const testDirectFetch = async () => {
    setIsLoading(true);
    setDebugInfo('Testing direct fetch...\n');
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';
      setDebugInfo(prev => prev + `Direct fetch to: ${apiUrl}/health\n`);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      setDebugInfo(prev => prev + `Response status: ${response.status}\n`);
      setDebugInfo(prev => prev + `Response ok: ${response.ok}\n`);
      setDebugInfo(prev => prev + `Response headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}\n`);
      
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);
      } else {
        const text = await response.text();
        setDebugInfo(prev => prev + `Response text: ${text}\n`);
      }
      
    } catch (error) {
      setDebugInfo(prev => prev + `Direct fetch error: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Debug</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Health Check</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testDirectFetch}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Direct Fetch</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.debugOutput}>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderRadius: 8,
    borderColor: '#00FFFF',
    borderWidth: 1,
    zIndex: 1000,
  },
  title: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#00FFFF',
    padding: 8,
    borderRadius: 4,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugOutput: {
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#00FFFF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
