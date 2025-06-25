import { useEffect, useState } from "react";
import { Button, FlatList, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [list1, setList1] = useState([
    {
      id: 1,
      name: "Apple",
    },
    {
      id: 2,
      name: "Orange",
    },
    {
      id: 3,
      name: "Banana",
    },
  ]);

  const [list2, setList2] = useState([
    {
      id: 4,
      name: "Pineapple",
    },
    {
      id: 5,
      name: "Guava",
    },
    {
      id: 6,
      name: "Cherry",
    },
  ]);

  const [list3, setList3] = useState(list2);

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("123");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button
        title="List 1"
        onPress={() => {
          setList3(list1);
        }}
      />
      <Button
        title="List 2"
        onPress={() => {
          setList3(list2);
        }}
      />
      <ListBest items={list3} />
    </SafeAreaView>
  );
}

export function ListWrong({ items }: { items: any[] }) {
  const [selection, setSelection] = useState<any>(null);

  // ❌ React renders first with old selection, then re-renders again
  useEffect(() => {
    setSelection(null);
  }, [items]);

  return (
    <SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelection(item)}>
            <Text
              style={{
                padding: 10,
                backgroundColor:
                  selection?.id === item.id ? "lightblue" : "white",
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export function ListBetter({ items }: { items: any[] }) {
  const [selection, setSelection] = useState<any>(null);
  const [prevItems, setPrevItems] = useState<any[]>(items);

  if (items !== prevItems) {
    setSelection(null);
    setPrevItems(items);
  }

  return (
    <SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelection(item)}>
            <Text
              style={{
                padding: 10,
                backgroundColor:
                  selection?.id === item.id ? "lightblue" : "white",
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export function ListBest({ items }: { items: any[] }) {
  const [selectionId, setSelectionId] = useState<string | null>(null);

  const selection = items.find((prev) => prev.id === selectionId) ?? null;

  return (
    <SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectionId(item.id)}>
            <Text
              style={{
                padding: 10,
                backgroundColor:
                  selection?.id === item.id ? "lightblue" : "white",
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
