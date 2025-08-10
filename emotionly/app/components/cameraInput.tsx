import React, { useRef, useState } from 'react';
import {View,Text,StyleSheet,Pressable,TouchableOpacity,Image,  Dimensions,} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Svg, Rect } from 'react-native-svg';
const { width, height } = Dimensions.get('window');

export default function CameraInput() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);

  // Function to send the photo frame to your backend and receive detections
  async function sendFrame(frameUri: string) {
    try {
      let formData = new FormData();
      formData.append('frame', {
        uri: frameUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const res = await fetch('http://<your-server-ip>:5000/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const json = await res.json();
      setDetections(json.detections || []);
      console.log('Detections:', json.detections);
    } catch (error) {
      console.error('Error sending frame:', error);
    }
  }

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

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const takePhoto = async () => {
    if (cameraRef.current && 'takePictureAsync' in cameraRef.current) {
      try {
        // @ts-ignore
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);

        // Send the captured photo to backend for analysis
        await sendFrame(photo.uri);
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar} />

      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          ratio="1:1"
          onCameraReady={() => console.log('Camera is ready')}
        />

        {/* Rotate Camera Button */}
        <TouchableOpacity onPress={toggleCameraType} style={styles.rotateButton}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
          <Ionicons name="camera" size={32} color="white" />
        </TouchableOpacity>

        {/* Preview */}
        {photoUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.closePreview}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        <Svg style={StyleSheet.absoluteFill}>
          {detections.map((det, i) => (
            <Rect
              key={i}
              x={det.x}
              y={det.y}
              width={det.width}
              height={det.height}
              stroke="red"
              strokeWidth={2}
              fill="transparent"
            />
          ))}
        </Svg> 
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black', // White background for notch/status area
  },
  topBar: {
    height: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: width,
    height: height,
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
  rotateButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 30,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#fafafaff',
    padding: 20,
    borderRadius: 50,
  },
  previewContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 10,
    margin: 10,
  },
  closePreview: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});
