// ProfileImagePicker.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../config/colors';
import maleAvatar from '../assets/male-transparent.png';
import femaleAvatar from '../assets/female-transparent.png';

const PROFILE_IMAGE_KEY = 'user_profile_image';

const ProfileImagePicker = ({
  gender,
  onImageSelected,
  selectedImage,
  size = 'medium', // small, medium, large
  theme = 'light', // light, dark
  customStyles = {},
  showHint = true,
  editable = true,
  borderStyle = 'circle', // circle, rounded, square
}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Responsive calculations
  const isSmallScreen = dimensions.width < 375;
  const isMediumScreen = dimensions.width >= 375 && dimensions.width < 414;
  const isLargeScreen = dimensions.width >= 414;
  const isTablet = dimensions.width >= 768;

  // Base scaling function
  const getScaledSize = baseSize => {
    if (isTablet) return baseSize * 1.4;
    if (isSmallScreen) return baseSize * 0.85;
    if (isMediumScreen) return baseSize;
    return baseSize * 1.1;
  };

  // Size configurations
  const sizeConfigs = {
    small: {
      avatarSize: getScaledSize(80),
      uploadIconSize: getScaledSize(24),
      deleteButtonSize: getScaledSize(20),
      uploadIconContainerSize: getScaledSize(28),
      deleteIconSize: getScaledSize(12),
      hintSize: getScaledSize(12),
      borderWidth: getScaledSize(2),
      spacing: getScaledSize(6),
    },
    medium: {
      avatarSize: getScaledSize(120),
      uploadIconSize: getScaledSize(36),
      deleteButtonSize: getScaledSize(28),
      uploadIconContainerSize: getScaledSize(36),
      deleteIconSize: getScaledSize(18),
      hintSize: getScaledSize(14),
      borderWidth: getScaledSize(2),
      spacing: getScaledSize(8),
    },
    large: {
      avatarSize: getScaledSize(160),
      uploadIconSize: getScaledSize(48),
      deleteButtonSize: getScaledSize(36),
      uploadIconContainerSize: getScaledSize(48),
      deleteIconSize: getScaledSize(24),
      hintSize: getScaledSize(16),
      borderWidth: getScaledSize(3),
      spacing: getScaledSize(12),
    },
  };

  const currentConfig = sizeConfigs[size] || sizeConfigs.medium;

  // Border radius configurations
  const borderRadiusConfigs = {
    circle: currentConfig.avatarSize / 2,
    rounded: currentConfig.avatarSize / 8,
    square: 0,
  };

  const currentBorderRadius =
    borderRadiusConfigs[borderStyle] || borderRadiusConfigs.circle;

  // Theme configurations
  const themes = {
    light: {
      backgroundColor: colors.light || '#f8f9fa',
      borderColor: colors.primaryColor || '#007AFF',
      hintColor: colors.medium || '#666666',
      uploadIconBackground: colors.primaryColor || '#007AFF',
      uploadIconColor: colors.white || '#ffffff',
      deleteButtonBackground: 'rgba(255, 0, 0, 0.8)',
      deleteIconColor: colors.white || '#ffffff',
    },
    dark: {
      backgroundColor: '#3a3a3a',
      borderColor: colors.primaryColor || '#0A84FF',
      hintColor: '#cccccc',
      uploadIconBackground: colors.primaryColor || '#0A84FF',
      uploadIconColor: colors.white || '#ffffff',
      deleteButtonBackground: 'rgba(255, 50, 50, 0.9)',
      deleteIconColor: colors.white || '#ffffff',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  // Load profile image on component mount
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImageUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
        if (savedImageUri) {
          setProfileImage({uri: savedImageUri});
          if (onImageSelected) {
            onImageSelected(savedImageUri);
          }
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };

    loadProfileImage();
  }, [onImageSelected]);

  // Handle selectedImage prop changes (for delete functionality)
  useEffect(() => {
    if (selectedImage === null) {
      // Clear the image when selectedImage is set to null
      setProfileImage(null);
      // Also clear from AsyncStorage
      AsyncStorage.removeItem(PROFILE_IMAGE_KEY).catch(error => {
        console.error('Error removing profile image from storage:', error);
      });
    } else if (selectedImage && selectedImage !== profileImage?.uri) {
      // Update when selectedImage changes to a new value
      setProfileImage({uri: selectedImage});
    }
  }, [selectedImage, profileImage?.uri]);

  const selectImage = async () => {
    if (!editable) return;

    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: currentConfig.avatarSize * 2, // Dynamic max size based on avatar size
      maxHeight: currentConfig.avatarSize * 2,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Something went wrong');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        const imageUri =
          Platform.OS === 'ios'
            ? selectedImage.uri.replace('file://', '')
            : selectedImage.uri;

        // Save image URI to local storage
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);

        // Update state and notify parent
        setProfileImage({uri: imageUri});
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const deleteImage = async () => {
    if (!editable) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove your profile photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from AsyncStorage
              await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);

              // Update state
              setProfileImage(null);

              // Notify parent
              if (onImageSelected) {
                onImageSelected(null);
              }
            } catch (error) {
              console.error('Error deleting profile image:', error);
              Alert.alert('Error', 'Failed to delete image. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Determine the image source
  const imageSource = profileImage
    ? profileImage
    : gender === 'Female'
    ? femaleAvatar
    : maleAvatar;

  // Determine if we should show the upload icon (only when using default avatar and editable)
  const showUploadIcon = !profileImage && editable;

  // Dynamic styles based on screen size, platform, and theme
  const responsiveStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    avatarContainer: {
      width: currentConfig.avatarSize,
      height: currentConfig.avatarSize,
      borderRadius: currentBorderRadius,
      backgroundColor: currentTheme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: currentConfig.borderWidth,
      borderColor: currentTheme.borderColor,
      position: 'relative',
      // overflow: 'hidden',
      // Platform-specific shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    avatarContainerDisabled: {
      opacity: 0.7,
    },
    avatar: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      borderRadius: currentBorderRadius - currentConfig.borderWidth,
    },
    uploadIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: currentTheme.uploadIconBackground,
      width: currentConfig.uploadIconContainerSize,
      height: currentConfig.uploadIconContainerSize,
      borderRadius: currentConfig.uploadIconContainerSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: currentConfig.borderWidth,
      borderColor: currentTheme.backgroundColor,
      zIndex: 10, // ADD THIS LINE

      // Platform-specific shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    uploadIcon: {
      fontSize: currentConfig.uploadIconSize * 0.6,
      color: currentTheme.uploadIconColor,
      includeFontPadding: false,
      textAlign: 'center',
    },
    deleteButton: {
      position: 'absolute',
      top: -currentConfig.deleteButtonSize / 4,
      right: -currentConfig.deleteButtonSize / 4,
      backgroundColor: currentTheme.deleteButtonBackground,
      width: currentConfig.deleteButtonSize,
      height: currentConfig.deleteButtonSize,
      borderRadius: currentConfig.deleteButtonSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: currentConfig.borderWidth,
      borderColor: currentTheme.backgroundColor,
      // Platform-specific shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    deleteIcon: {
      fontSize: currentConfig.deleteIconSize,
      color: currentTheme.deleteIconColor,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      lineHeight: currentConfig.deleteIconSize,
      includeFontPadding: false,
      textAlign: 'center',
    },
    hint: {
      marginTop: currentConfig.spacing,
      fontSize: currentConfig.hintSize,
      color: currentTheme.hintColor,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      maxWidth: currentConfig.avatarSize * 1.5,
      lineHeight: currentConfig.hintSize * 1.3,
    },
  });

  return (
    <View style={[responsiveStyles.container, customStyles.container]}>
      <TouchableOpacity
        style={[
          responsiveStyles.avatarContainer,
          !editable && responsiveStyles.avatarContainerDisabled,
          customStyles.avatarContainer,
        ]}
        onPress={selectImage}
        disabled={!editable}
        accessible={true}
        accessibilityLabel={
          editable ? 'Upload profile picture' : 'Profile picture'
        }
        accessibilityRole="button"
        accessibilityHint={
          editable
            ? 'Double tap to select a new profile picture from your photo library'
            : undefined
        }
        activeOpacity={editable ? 0.7 : 1}>
        <Image
          source={imageSource}
          style={[responsiveStyles.avatar, customStyles.avatar]}
          accessible={false}
        />

        {showUploadIcon && (
          <View
            style={[
              responsiveStyles.uploadIconContainer,
              customStyles.uploadIcon,
            ]}>
            <Text style={responsiveStyles.uploadIcon}>📷</Text>
          </View>
        )}

        {profileImage && editable && (
          <TouchableOpacity
            style={[responsiveStyles.deleteButton, customStyles.deleteButton]}
            onPress={deleteImage}
            accessible={true}
            accessibilityLabel="Delete profile picture"
            accessibilityRole="button"
            accessibilityHint="Double tap to remove your current profile picture"
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={responsiveStyles.deleteIcon}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {showHint && (
        <Text
          style={[responsiveStyles.hint, customStyles.hint]}
          accessible={true}
          accessibilityLabel={
            profileImage ? 'Tap to change photo' : 'Tap to add photo'
          }>
          {editable
            ? profileImage
              ? 'Tap to change photo'
              : 'Tap to add photo'
            : 'Profile photo'}
        </Text>
      )}
    </View>
  );
};

ProfileImagePicker.propTypes = {
  gender: PropTypes.string,
  onImageSelected: PropTypes.func,
  selectedImage: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  theme: PropTypes.oneOf(['light', 'dark']),
  customStyles: PropTypes.object,
  showHint: PropTypes.bool,
  editable: PropTypes.bool,
  borderStyle: PropTypes.oneOf(['circle', 'rounded', 'square']),
};

export default ProfileImagePicker;
