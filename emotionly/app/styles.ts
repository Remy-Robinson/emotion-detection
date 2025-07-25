import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
    alignItems: 'flex-end',
  },
  button: {
    padding: 16,
    backgroundColor: '#00000080',
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
});
