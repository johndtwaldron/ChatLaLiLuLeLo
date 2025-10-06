import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { 
  getCodecTheme, 
  subscribeToThemeChanges,
  getCurrentModel,
  setModel,
  getModelConfig,
  modelConfigs,
  saveModelSelection,
  initializeModel,
  type ModelType
} from '@/lib/theme';

interface ModelToggleProps {
  // Optional props for future customization
  showCostHint?: boolean;
}

export const ModelToggle: React.FC<ModelToggleProps> = ({ 
  showCostHint = true 
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [currentModel, setCurrentModelState] = useState<ModelType>(getCurrentModel());
  const [showDropdown, setShowDropdown] = useState(false);

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
      setCurrentModelState(getCurrentModel());
    });
    return unsubscribe;
  }, []);

  // Initialize model from localStorage on component mount
  useEffect(() => {
    initializeModel();
    setCurrentModelState(getCurrentModel());
  }, []);

  // Handle model selection
  const handleModelSelect = (model: ModelType) => {
    setModel(model);
    saveModelSelection(model);
    setCurrentModelState(model);
    setShowDropdown(false);
  };

  // Toggle dropdown visibility
  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const currentModelConfig = getModelConfig(currentModel);

  const themeStyles = getThemeStyles(currentTheme);

  return (
    <View style={staticStyles.container}>
      {/* Main toggle button */}
      <TouchableOpacity 
        onPress={handleToggleDropdown}
        style={[
          staticStyles.toggleButton,
          themeStyles.toggleButton,
          showDropdown && themeStyles.toggleButtonActive
        ]}
      >
        <Text style={[staticStyles.buttonText, themeStyles.buttonText]}>
          MODEL: {currentModelConfig.name}
        </Text>
        {showCostHint && (
          <Text style={[staticStyles.costHint, themeStyles.costHint]}>
            {currentModelConfig.cost}
          </Text>
        )}
        <Text style={[staticStyles.arrow, themeStyles.arrow]}>
          {showDropdown ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Dropdown menu */}
      {showDropdown && (
        <View style={[staticStyles.dropdown, themeStyles.dropdown]}>
          {(Object.keys(modelConfigs) as ModelType[]).map((modelKey) => {
            const config = modelConfigs[modelKey];
            const isSelected = modelKey === currentModel;
            
            return (
              <TouchableOpacity
                key={modelKey}
                onPress={() => handleModelSelect(modelKey)}
                style={[
                  staticStyles.dropdownItem,
                  themeStyles.dropdownItem,
                  isSelected && themeStyles.dropdownItemSelected
                ]}
              >
                <View style={staticStyles.dropdownItemContent}>
                  <Text style={[
                    staticStyles.dropdownItemName,
                    themeStyles.dropdownItemName,
                    isSelected && themeStyles.dropdownItemNameSelected
                  ]}>
                    {config.name}
                  </Text>
                  <Text style={[
                    staticStyles.dropdownItemDescription,
                    themeStyles.dropdownItemDescription
                  ]}>
                    {config.description}
                  </Text>
                </View>
                <View style={staticStyles.dropdownItemCost}>
                  <Text style={[
                    staticStyles.dropdownItemCostText,
                    themeStyles.dropdownItemCostText
                  ]}>
                    {config.cost}
                  </Text>
                  {isSelected && (
                    <Text style={[
                      staticStyles.selectedIndicator,
                      themeStyles.selectedIndicator
                    ]}>
                      ●
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Close button for dropdown */}
          <TouchableOpacity
            onPress={() => setShowDropdown(false)}
            style={[staticStyles.closeDropdown, themeStyles.closeDropdown]}
          >
            <Text style={[staticStyles.closeText, themeStyles.closeText]}>
              CLOSE
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Static styles - theme-independent positioning and layout
const staticStyles = StyleSheet.create({
  container: {
    // Remove absolute positioning to participate in flex layout
    zIndex: 150, // Higher than other buttons to show dropdown
  },

  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 140,
  },

  buttonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },

  costHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
    textAlign: 'center',
  },

  arrow: {
    fontSize: 8,
    fontFamily: 'monospace',
    marginTop: 2,
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 4,
    borderWidth: 1,
    maxHeight: 300,
  },

  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  dropdownItemContent: {
    flex: 1,
  },

  dropdownItemName: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  dropdownItemDescription: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 2,
    opacity: 0.8,
  },

  dropdownItemCost: {
    alignItems: 'flex-end',
    minWidth: 80,
  },

  dropdownItemCostText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },

  selectedIndicator: {
    fontSize: 12,
    marginTop: 2,
  },

  closeDropdown: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },

  closeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

// Dynamic styles function that takes current theme
const getThemeStyles = (theme: any) => ({
  toggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: theme.colors.primary,
  },

  toggleButtonActive: {
    backgroundColor: theme.colors.primary + '20', // Add transparency
  },

  buttonText: {
    color: theme.colors.primary,
  },

  costHint: {
    color: theme.colors.textSecondary,
  },

  arrow: {
    color: theme.colors.primary,
  },

  dropdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  dropdownItem: {
    borderBottomColor: theme.colors.border + '40',
  },

  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },

  dropdownItemName: {
    color: theme.colors.text,
  },

  dropdownItemNameSelected: {
    color: theme.colors.primary,
  },

  dropdownItemDescription: {
    color: theme.colors.textSecondary,
  },

  dropdownItemCostText: {
    color: theme.colors.textSecondary,
  },

  selectedIndicator: {
    color: theme.colors.primary,
  },

  closeDropdown: {
    borderTopColor: theme.colors.border,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  closeText: {
    color: theme.colors.textSecondary,
  },
});
