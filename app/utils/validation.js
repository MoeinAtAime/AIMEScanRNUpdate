// utils/validation.js

// Updated validation functions
export const validateHeight = heightStr => {
  // Height in format "feet.inches" like "5.10"
  if (!heightStr) return false;

  const parts = heightStr.split('.');
  if (parts.length !== 2) return false;

  const feet = parseInt(parts[0], 10);
  const inches = parseInt(parts[1], 10);

  if (isNaN(feet) || isNaN(inches)) return false;

  // Convert feet/inches to cm
  const totalInches = feet * 12 + inches;
  const heightInCm = totalInches * 2.54;

  // Check if height is between 130-230 cm
  return heightInCm >= 130 && heightInCm <= 230;
};

export const validateWeight = weight => {
  if (!weight) return false;

  const pounds = parseFloat(weight);
  if (isNaN(pounds)) return false;

  // Convert pounds to kg (1 pound = 0.453592 kg)
  const weightInKg = pounds * 0.453592;

  // Check if weight is between 40-200 kg
  return weightInKg >= 40 && weightInKg <= 200;
};

export const formatHeight = value => {
  // Remove any non-numeric characters except decimal point
  const formatted = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = formatted.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts[1];
  }

  return formatted;
};

export const formatWeight = value => {
  // Remove any non-numeric characters
  return value.replace(/[^\d]/g, '');
};
