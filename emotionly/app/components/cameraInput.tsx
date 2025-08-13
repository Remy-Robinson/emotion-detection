import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Image } from 'react-native';
import { Camera, CameraCapturedPicture, useCameraPermissions } from 'expo-camera';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = "http://YOUR_SERVER_IP:5001/detect_faces"; // << replace
const { width, height } = Dimensions.get('window');

type Detection = {
  box: [number, number, number, number];
  class_name: string;
  confidence?: number;
};

export default function CameraInput() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [cameraType, setCameraType] = useState(Constants.Type.front);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // for backward compatibility with face detection code
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });

  const CAPTURE_INTERVAL = 800; // ms
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Sync permission from expo-camera's hook to hasPermission state
  useEffect(() => {
    if (permission) setHasPermission(permission.granted);
  }, [permission]);

  // Periodic capture and send while permission granted
  useEffect(() => {
    if (hasPermission) {
      const id = setInterval(() => {
        captureAndSend();
      }, CAPTURE_INTERVAL);
      setIntervalId(id);
      return () => {
        if (id) clearInterval(id);
      };
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [hasPermission, cameraType]);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Camera permission not granted</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraType = () => {
    setCameraType((prev) =>
      prev === Camera.Constants.Type.front
        ? Camera.Constants.Type.back
        : Camera.Constants.Type.front
    );
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
          skipProcessing: true,
        });
        setPhotoUri(photo.uri);
      } catch (e) {
        console.warn('takePhoto error', e);
      }
    }
  };

  const captureAndSend = async () => {
    if (!cameraRef.current) return;
    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: true,
      });
      const uri = photo.uri;

      const form = new FormData();
      form.append('frame', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: 'frame.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        body: form,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!res.ok) {
        console.warn('Server error', res.status);
        return;
      }

      const json = await res.json();
      if (json.image_width && json.image_height) {
        setImgSize({ w: json.image_width, h: json.image_height });
      }
      setDetections(json.detections || []);
    } catch (e: any) {
      console.warn('capture/send error', e.message);
    }
  };

  // Scale face detection boxes to screen coords
  const scaleBox = (box: [number, number, number, number]) => {
    const [x1, y1, x2, y2] = box;
    const scaleX = width / imgSize.w;
    const scaleY = height / imgSize.h;
    return [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY];
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar} />

      <View style={styles.container}>
        <Camera
          style={styles.camera}
          ref={cameraRef}
          ratio="16:9"
          type={cameraType}
        />

        {/* Face detection overlays */}
        <Svg style={styles.overlay} pointerEvents="none">
          {detections.map((d, i) => {
            const box = d.box;
            if (!box) return null;
            const [x1, y1, x2, y2] = scaleBox(box);
            const label = `${d.class_name} ${Math.round((d.confidence || 0) * 100)}%`;
            return (
              <React.Fragment key={i}>
                <Rect
                  x={x1}
                  y={y1}
                  width={Math.max(1, x2 - x1)}
                  height={Math.max(1, y2 - y1)}
                  stroke="red"
                  strokeWidth="2"
                  fill="transparent"
                />
                <SvgText
                  x={x1}
                  y={Math.max(14, y1 - 6)}
                  fill="yellow"
                  fontSize="14"
                  stroke="black"
                  strokeWidth="0.3"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Toggle front/back camera button */}
        <TouchableOpacity onPress={toggleCameraType} style={styles.rotateButton}>
          <Ionicons name="camera-reverse" size={28} color="white" />
        </TouchableOpacity>

        {/* Capture button */}
        <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
          <Ionicons name="camera" size={32} color="white" />
        </TouchableOpacity>

        {/* Manual Capture Now for sending image to server immediately */}
        <TouchableOpacity onPress={captureAndSend} style={[styles.captureButton, { bottom: 100, backgroundColor: '#1e88e5' }]}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Capture Now</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#282323ff', // Dark background for notch/status area
  },
  topBar: {
    height: 0, // SafeAreaView already gives padding at top, but you can add extra if needed
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    zIndex: 10,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#fafafaff',
    padding: 20,
    borderRadius: 50,
    zIndex: 10,
  },
  previewContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
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
