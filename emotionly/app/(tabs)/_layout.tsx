import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#25292e" },
        headerTintColor: "#FFFFFF",
        tabBarActiveTintColor: "#e91e63",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "#282323ff" },
      }}>
      <Tabs.Screen 
      name="index" 
      options={{ 
        headerShown: false,
        title: "Home",
        tabBarIcon: ({focused, color}) => 
        <Ionicons 
          name={focused? "home-sharp" : "home-outline"} 
          color={color}
          size={24}
        />,

        }} 
        />

    
      <Tabs.Screen 
      name="camera" 
      options={{ 
        title: "Camera",
        headerShown: false,
        tabBarIcon: ({focused, color}) => (
        <Ionicons 
          name={focused? "camera-sharp" : "camera-outline"} 
          color={color}
          size={24}
          />
        ),
        }} 
        />
        
      <Tabs.Screen 
      
      name="about" 
      options={{ 
        title: "About",
        headerShown: false,
        tabBarIcon: ({focused, color}) => (
        <Ionicons 
          name={focused? "information-circle-sharp" : "information-circle-outline"} 
          color={color}
          size={24}
          />
        ),
        }} 
        />


    </Tabs>
  );
}