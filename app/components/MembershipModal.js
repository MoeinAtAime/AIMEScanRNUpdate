//Old membership modal without improvement.

import React from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import colors from '../config/colors';

const MembershipModal = ({visible, onClose}) => {
  // Direct linking functions - using the same approach from your registration page
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
          <Text style={styles.modalTitle}>Membership Required</Text>

          <Text style={styles.modalText}>
            Thank you for downloading our app! We appreciate your interest in
            our services. However, it appears that you don’t have an active
            membership, which is required to access the full features of AIME.
          </Text>

          <Text style={styles.modalText}>
            To ensure you receive the best experience, including exclusive
            benefits, you can sign up at{' '}
            <Text style={styles.linkText} onPress={openWebsite}>
              https://aimescan.com/member/login/
            </Text>
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
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
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
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
    padding: 12,
    elevation: 2,
    alignSelf: 'center',
    minWidth: 100,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default MembershipModal;
