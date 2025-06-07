import { useState } from "react";
import { Button, FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const def = [
    { id: "1", name: "iPhone 15", inStock: true },
    { id: "2", name: "Samsung Galaxy S24", inStock: false },
    { id: "3", name: "Google Pixel 8", inStock: true },
    { id: "4", name: "OnePlus 12", inStock: true },
    { id: "5", name: "Nokia 3310", inStock: false },
  ];
  const [products, setProducts] = useState<any[]>([...def]);

  const [showProducts, setShowProducts] = useState(false);

  console.log("prodpt" + JSON.stringify(products));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button
        title="Click Me"
        onPress={() => {
          setShowProducts((prev) => !prev);
        }}
      />
      <Button
        title="Delete a product"
        onPress={() => {
          setProducts((prev: any[]) => prev.slice(0, -1));
        }}
      />
      <Button
        title="Refresh"
        onPress={() => {
          setProducts([...def]);
        }}
      />
      {showProducts ? <ProductListWrong products={products} /> : null}
    </SafeAreaView>
  );
}

const ProductListWrong = ({ products }: any) => {
  const inStockProducts = products.filter((p: any) => p.inStock);
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  );
};
