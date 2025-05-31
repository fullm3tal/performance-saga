import React, { memo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [count, setCount] = React.useState(0);
  const [second, setSecond] = React.useState(0);

  const onPressOne = useCallback(() => setCount(count + 1), [count]);
  const onPressTwo = useCallback(() => setSecond(second + 1), [second]);

  return (
    <SafeAreaView>
      <View style={{}}>
        <Text>Welcome!</Text>
        <Text>{count}</Text>
        <Text>{second}</Text>
        <Button onPress={onPressOne} title="Press one" />
        <Button
          onPress={onPressTwo}
          title="Press
    two"
        />
      </View>
    </SafeAreaView>
  );
}

const Button = memo(
  ({ onPress, title }: { onPress: () => void; title: string }) => {
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
        <Text style={{ textAlign: "center", alignSelf: "center" }}>
          {title}
        </Text>
      </Pressable>
    );
  }
);
