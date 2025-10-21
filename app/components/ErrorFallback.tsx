// components/ErrorFallback.tsx
import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({error, retry}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Button title="Try Again" onPress={retry} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#212529',
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ErrorFallback;
