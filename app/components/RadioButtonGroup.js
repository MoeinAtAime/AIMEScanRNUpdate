//////////////Font Increase Limit Fix

// RadioButtonGroup.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const RadioButtonGroup = ({
  options,
  selectedOption,
  onSelectOption,
  color = '#007AFF',
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = selectedOption === option;
        return (
          <TouchableOpacity
            key={index}
            style={styles.optionContainer}
            onPress={() => !disabled && onSelectOption(option)}
            activeOpacity={0.7}
            disabled={disabled}
            accessible={true}
            accessibilityRole="radio"
            accessibilityState={{selected: isSelected, disabled}}
            accessibilityLabel={option}>
            <View
              style={[
                styles.radioButton,
                {borderColor: color},
                isSelected && {borderColor: color},
              ]}>
              {isSelected && (
                <View
                  style={[styles.radioButtonSelected, {backgroundColor: color}]}
                />
              )}
            </View>
            <Text
              style={[styles.optionText, isSelected && {color: color}]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // allow wrapping if too many options
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 12,
    minHeight: 44, // Ensure minimum touch target height
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default RadioButtonGroup;
