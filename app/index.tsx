import { Card } from "@/components/common/Card";
import { useCallback } from "react";
import { FlatList, ListRenderItemInfo, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const data = Array.from({ length: 1000 }, (_, i) => `Number ${i + 1}`);

  const onPress = () => {
    console.log(`Current time is ${Date.now()}`);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<any>) => {
    return (
      <Card
        label={item.toString()}
        onPress={() => {
          console.log(`Current time is ${Date.now()}`);
        }}
      />
    );
  };

  const renderKey = useCallback((item: string, index: number) => {
    return item;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
        }}
      >
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={renderKey}
          windowSize={5}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={10}
        />
      </View>
    </SafeAreaView>
  );
}
