import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [count, setCount] = React.useState(0);
  const [second, setSecond] = React.useState(0);

  return (
    <SafeAreaView>
      <View style={{}}>
        <Text>Welcome!</Text>
        <Text>{count}</Text>
        <Text>{second}</Text>
        <Button onPress={() => setCount(count + 1)} title="Press one" />
        <Button
          onPress={() => setSecond(second + 1)}
          title="Press
    two"
        />
      </View>
    </SafeAreaView>
  );
}

const Button = ({ onPress, title }: { onPress: () => void; title: string }) => {
  return (
    <Pressable
      style={{
        width: "90%",
        backgroundColor: "red",
        padding: 8,
        marginVertical: 4,
        alignSelf: "center",
      }}
      onPress={onPress}
    >
      <Text style={{ textAlign: "center", alignSelf: "center" }}>{title}</Text>
    </Pressable>
  );
};
