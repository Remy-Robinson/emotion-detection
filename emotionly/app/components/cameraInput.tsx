import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Camera, CameraCapturedPicture, CameraType, CameraView } from 'expo-camera';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

const BACKEND_URL = 'http://10.0.0.44:5001/detect_faces'; // << replace

type Detection = {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  class_name: string;
  confidence?: number;
};

export default function App() {
  const cameraRef = useRef<CameraView | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const CAPTURE_INTERVAL = 800; // ms

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hasPermission) {
      const interval = setInterval(() => {
        captureAndSend();
      }, CAPTURE_INTERVAL);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasPermission]);

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
      // React Native FormData accepts a file-like object { uri, name, type }
      form.append(
        'frame',
        {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: 'frame.jpg',
          type: 'image/jpeg',
        } as any // RN's FormData file type
      );

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
      setDetections((json.detections || []) as Detection[]);
    } catch (e: any) {
      console.warn('capture/send error', e?.message ?? e);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No camera permission</Text>;

  const { width: screenW, height: screenH } = Dimensions.get('window');

  // scale boxes from original image coords to screen coords (camera preview assumed full screen)
  const scaleBox = (box: [number, number, number, number]) => {
    const [x1, y1, x2, y2] = box;
    const scaleX = screenW / imgSize.w;
    const scaleY = screenH / imgSize.h;
    return [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY] as const;
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        ref={cameraRef}
        ratio="16:9"
        // keep "front" camera as in your original
        facing="front"
      />

      <Svg style={styles.overlay} pointerEvents="none">
        {detections.map((d, i) => {
          if (!d?.box) return null;
          const [x1, y1, x2, y2] = scaleBox(d.box);
          const label = `${d.class_name} ${Math.round((d.confidence || 0) * 100)}%`;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x1}
                y={y1}
                width={Math.max(1, x2 - x1)}
                height={Math.max(1, y2 - y1)}
                stroke="red"
                strokeWidth={2}
                fill="transparent"
              />
              <SvgText
                x={x1}
                y={Math.max(14, y1 - 6)}
                fill="yellow"
                fontSize={14}
                stroke="black"
                strokeWidth={0.3}
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={captureAndSend}>
          <Text style={{ color: '#fff' }}>Capture Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  footer: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
  btn: { padding: 10, backgroundColor: '#1e88e5', borderRadius: 8 },
});
