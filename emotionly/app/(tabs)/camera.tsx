import React from 'react';
import { Text, View, StyleSheet } from "react-native";
import {styles} from '../styles';
import CameraInput from '../components/cameraInput';

export default function camera(){
    return (
        <View style={styles.container}>
        <CameraInput />
        {/* Camera component will be implemented here */}
        </View>
    );
}