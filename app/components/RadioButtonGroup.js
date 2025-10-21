// Import React library and necessary components from React Native
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

/**
 * A functional component for rendering a group of radio buttons.
 * @param {Array<string>} options - Array of options to display as radio buttons.
 * @param {string} selectedOption - The currently selected option.
 * @param {function} onSelectOption - Callback function invoked when an option is selected.
 * @returns JSX.Element
 */
const RadioButtonGroup = ({options, selectedOption, onSelectOption}) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        // Touchable area for each radio button
        <TouchableOpacity
          key={index} // Assign a unique key to each option for React rendering
          style={styles.optionContainer} // Container styling for each option
          onPress={() => onSelectOption(option)} // Trigger callback when pressed
        >
          <View style={styles.radioButton}>
            {/* Display the inner circle if the current option is selected */}
            {selectedOption === option && (
              <View style={styles.radioButtonSelected} />
            )}
          </View>
          {/* Label for the radio button */}
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * StyleSheet for the RadioButtonGroup component.
 */
const styles = StyleSheet.create({
  // Container for the group of radio buttons
  container: {
    flexDirection: 'row', // Arrange options horizontally
    marginBottom: 20, // Add spacing below the group
  },
  // Container for each radio button and its label
  optionContainer: {
    flexDirection: 'row', // Arrange radio button and label side by side
    alignItems: 'center', // Vertically center the elements
    marginRight: 20, // Add spacing between options
  },
  // Outer circle of the radio button
  radioButton: {
    height: 20, // Diameter of the circle
    width: 20, // Diameter of the circle
    borderRadius: 10, // Make it a perfect circle
    borderWidth: 2, // Thickness of the border
    borderColor: '#007AFF', // Color of the border (blue)
    alignItems: 'center', // Center the inner circle horizontally
    justifyContent: 'center', // Center the inner circle vertically
    marginRight: 8, // Space between the circle and the label
  },
  // Inner circle of the radio button (visible only if selected)
  radioButtonSelected: {
    height: 10, // Diameter of the inner circle
    width: 10, // Diameter of the inner circle
    borderRadius: 5, // Make it a perfect circle
    backgroundColor: '#007AFF', // Fill color for the selected state
  },
  // Styling for the option label text
  optionText: {
    fontSize: 16, // Font size for readability
    color: '#333', // Text color (dark gray)
  },
});

// Export the component for use in other parts of the app
export default RadioButtonGroup;
