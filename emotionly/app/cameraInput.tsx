import {styles} from './styles';
import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Button } from 'react-native'; // StyleSheet import removed
import { Camera } from 'expo-camera';

export default function App() {
  // State to hold camera permission status
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  // State to manage the camera type (front/back)
  const [type, setType] = useState(Camera.Constants.Type.back);

  // useEffect hook to request camera permissions when the component mounts
  useEffect(() => {
    (async () => {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []); // Empty dependency array means this runs once on mount

  // If permissions are still null, it means we are waiting for the user's response
  if (hasPermission === null) {
    return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}><Text style={{ color: 'white' }}>Requesting camera permission...</Text></View>;
  }
  // If permissions are denied, inform the user
  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
        <Text style={{ textAlign: 'center', color: 'white' }}>
          No access to camera. Please enable camera permissions in your device settings.
        </Text>
      </View>
    );
  }

  // Main render function for the camera component
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
      <Camera style={{ flex: 1 }} type={type}>
        <View style={{ flex: 1, backgroundColor: 'transparent', flexDirection: 'row', margin: 20, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          {/* Button to toggle between front and back camera */}
          <TouchableOpacity
            style={{ flex: 0.3, alignSelf: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10, marginHorizontal: 5 }}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}>
            <Text style={{ fontSize: 18, color: 'white' }}>Flip Camera</Text>
          </TouchableOpacity>
          {/*
            // Uncomment the following section to add a "Take Photo" button
            // You would typically use a ref to the Camera component to call its takePictureAsync method
            // For example:
            // const cameraRef = useRef<Camera>(null);
            // const takePicture = async () => {
            //   if (cameraRef.current) {
            //     const photo = await cameraRef.current.takePictureAsync();
            //     console.log(photo.uri); // Do something with the photo URI
            //   }
            // };
            // <TouchableOpacity style={styles.button} onPress={takePicture}>
            //   <Text style={styles.text}>Take Photo</Text>
            // </TouchableOpacity>
          */}
        </View>
      </Camera>
    </View>
  );
}
