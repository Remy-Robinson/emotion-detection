import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraInput() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Camera permission not granted</Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={() => console.log('Camera is ready')}
      />
      {/* Optional: Add some UI elements to confirm the camera is working */}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Camera Preview</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Ensure background is black to see camera better
    justifyContent: 'center',
  },
  camera: {
    width: '100%',
    aspectRatio: 3/4, // Standard camera aspect ratio
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
  },
});