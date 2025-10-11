import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { type Message } from '@/types/chat';

interface TranscriptOptions {
  includeTimestamps?: boolean;
  includeMeta?: boolean;
  format?: 'txt' | 'json';
}

/**
 * File service for handling transcript downloads and file operations
 * Provides cross-platform file saving with appropriate platform-specific methods
 */
export class FileService {
  /**
   * Generate transcript content from messages
   */
  private static generateTranscriptContent(
    messages: Message[], 
    options: TranscriptOptions = {}
  ): string {
    const { includeTimestamps = true, includeMeta = false, format = 'txt' } = options;
    
    if (format === 'json') {
      return JSON.stringify(messages, null, 2);
    }
    
    // Text format
    const header = [
      '='.repeat(80),
      'ChatLaLiLuLeLo - Codec Conversation Transcript',
      `Generated: ${new Date().toISOString()}`,
      `Messages: ${messages.length}`,
      '='.repeat(80),
      ''
    ].join('\n');
    
    const transcriptLines = messages.map(message => {
      const parts: string[] = [];
      
      // Timestamp
      if (includeTimestamps) {
        const timestamp = new Date(message.timestamp).toLocaleString();
        parts.push(`[${timestamp}]`);
      }
      
      // Speaker and message
      const speaker = message.speaker === 'user' ? 'USER' : 'COLONEL';
      const cleanText = message.text.replace(/^USER: /, ''); // Remove USER: prefix if present
      parts.push(`${speaker}: ${cleanText}`);
      
      // Meta information
      if (includeMeta && message.meta) {
        const metaParts = [
          `Mode: ${message.meta.mode}`,
          `Model: ${message.meta.model}`,
          `Type: ${message.meta.kind}`
        ].join(', ');
        parts.push(`  [${metaParts}]`);
      }
      
      return parts.join(' ') + '\n';
    }).join('\n');
    
    return header + transcriptLines + '\n' + '='.repeat(80) + '\n';
  }
  
  /**
   * Generate filename with timestamp
   */
  private static generateFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19); // Remove milliseconds and timezone
    
    return `Codec.AI.convo.${timestamp}.transcript.txt`;
  }
  
  /**
   * Download transcript for web platform
   */
  private static downloadTranscriptWeb(content: string, filename: string): void {
    // Create blob and download link for web
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Share transcript for native platforms
   */
  private static async shareTranscriptNative(content: string, filename: string): Promise<void> {
    // Create temporary file
    const fileUri = (documentDirectory || '') + filename;
    
    try {
      // Write content to file
      await writeAsStringAsync(fileUri, content, {
        encoding: EncodingType.UTF8,
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Save Transcript',
          UTI: 'public.plain-text',
        });
      } else {
        console.log('[FILE] Sharing not available, file saved to:', fileUri);
      }
      
    } catch (error) {
      console.error('[FILE] Failed to save transcript:', error);
      throw new Error('Failed to save transcript file');
    }
  }
  
  /**
   * Main transcript download function
   * Cross-platform compatible with appropriate file save methods
   */
  static async downloadTranscript(
    messages: Message[], 
    options: TranscriptOptions = {}
  ): Promise<void> {
    try {
      const content = this.generateTranscriptContent(messages, options);
      const filename = this.generateFilename();
      
      console.log(`[FILE] Generating transcript: ${filename}`);
      console.log(`[FILE] Content length: ${content.length} characters`);
      
      if (Platform.OS === 'web') {
        // Web platform: Direct download
        this.downloadTranscriptWeb(content, filename);
        console.log('[FILE] Web download initiated');
      } else {
        // Native platforms: Share API
        await this.shareTranscriptNative(content, filename);
        console.log('[FILE] Native share completed');
      }
      
    } catch (error) {
      console.error('[FILE] Transcript download failed:', error);
      throw error;
    }
  }
  
  /**
   * Get transcript preview (first few lines)
   */
  static getTranscriptPreview(messages: Message[], maxLines: number = 5): string {
    const content = this.generateTranscriptContent(messages, { 
      includeTimestamps: false,
      includeMeta: false 
    });
    
    const lines = content.split('\n');
    const preview = lines.slice(0, Math.min(maxLines + 3, lines.length)); // +3 for header
    
    return preview.join('\n') + (lines.length > maxLines + 3 ? '\n...' : '');
  }
}

// Convenience functions for easy imports
export const downloadTranscript = (messages: Message[], options?: TranscriptOptions) => 
  FileService.downloadTranscript(messages, options);

export const getTranscriptPreview = (messages: Message[], maxLines?: number) => 
  FileService.getTranscriptPreview(messages, maxLines);
