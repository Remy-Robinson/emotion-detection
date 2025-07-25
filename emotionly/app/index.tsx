import { Text, View, StyleSheet } from "react-native";
import {styles} from './styles'
import {Link} from "expo-router"
import * as MediaLibrary from 'expo-media-library';
import CameraInput from './cameraInput';

export default function Index() {
  return (
    <View style ={styles.container}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Link href = './about'>Button Here</Link>
      <Text>Camera Input Below</Text>
      <CameraInput/>
    </View>
  );
}


