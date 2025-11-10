//////Font Increase Limit Fix

// MembershipModal.js
import React from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import colors from '../config/colors';

const MembershipModal = ({visible, onClose}) => {
  const openWebsite = () => {
    Linking.openURL('https://aimescan.com/member/login/');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}>
            <Text
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}
              style={styles.modalTitle}>
              Membership Required
            </Text>

            <Text
              allowFontScaling={true}
              maxFontSizeMultiplier={1.15}
              style={styles.modalText}>
              Thank you for downloading our app! We appreciate your interest in
              our services. However, it appears that you don’t have an active
              membership, which is required to access the full features of AIME.
            </Text>

            <Text
              allowFontScaling={true}
              maxFontSizeMultiplier={1.15}
              style={styles.modalText}>
              To ensure you receive the best experience, including exclusive
              benefits, you can sign up at{' '}
              <Text
                allowFontScaling={true}
                maxFontSizeMultiplier={1.15}
                style={styles.linkText}
                onPress={openWebsite}>
                https://aimescan.com/member/login/
              </Text>
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}
              style={styles.buttonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalView: {
    width: '90%',
    maxHeight: '80%', // limit height so scrolling works
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    // Shadow/elevation
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'stretch',
  },
  scrollContentContainer: {
    // ensures content flows and scrolls
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'left',
    lineHeight: 22,
    color: '#444',
  },
  linkText: {
    color: colors.primaryColor || '#4285F4',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primaryColor || '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignSelf: 'center',
    minWidth: 110,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MembershipModal;
