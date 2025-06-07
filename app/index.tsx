import { useEffect, useMemo, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [showForm, setShowForm] = useState(false);

  const todos = [
    { id: "1", text: "Buy groceries", completed: true },
    { id: "2", text: "Walk the dog", completed: false },
    { id: "3", text: "Read a book", completed: false },
    { id: "4", text: "Pay bills", completed: true },
    { id: "5", text: "Workout", completed: false },
  ];
  const [filter, setFilter] = useState("all");
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button
        title="Click Me"
        onPress={() => {
          setShowForm((prev) => !prev);
        }}
      />

      <View>
        <Button onPress={() => setFilter("all")} title="All" />
        <Button onPress={() => setFilter("pending")} title="Pending" />
        <Button onPress={() => setFilter("completed")} title="Completed" />
      </View>

      {showForm ? <TodoListcached todos={todos} filter={filter} /> : null}
    </SafeAreaView>
  );
}

function TodoListWrong({ todos, filter }: any) {
  const [newTodo, setNewTodo] = useState("");
  const [visibleTodos, setVisibleTodos] = useState<any[] | undefined>([]);

  useEffect(() => {
    const filtered: any[] | undefined = getFilteredTodos(todos, filter);
    setVisibleTodos(filtered);
  }, [todos, filter]);

  return (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput
        placeholder="New todo"
        value={newTodo}
        onChangeText={setNewTodo}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <FlatList
        data={visibleTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </SafeAreaView>
  );
}

function TodoList({ todos, filter }: any) {
  const [newTodo, setNewTodo] = useState("");

  // ✅ Directly compute during render
  const visibleTodos = getFilteredTodos(todos, filter);

  return (
    <View>
      <TextInput value={newTodo} onChangeText={setNewTodo} />
      {visibleTodos?.map((todo) => (
        <Text key={todo.id}>{todo.text}</Text>
      ))}
    </View>
  );
}

function TodoListcached({ todos, filter }: any) {
  const [newTodo, setNewTodo] = useState("");

  // ✅ Caches result. Only recalculates when todos/filter change
  const visibleTodos = useMemo(
    () => getFilteredTodos(todos, filter),
    [todos, filter] // Dependencies
  );

  return (
    <View>
      <TextInput value={newTodo} onChangeText={setNewTodo} />
      {visibleTodos?.map((todo) => (
        <Text key={todo.id}>{todo.text}</Text>
      ))}
    </View>
  );
}

function getFilteredTodos(todos: any[], filter: any) {
  console.log("Filtering todos..."); // Simulate heavy work
  if (filter === "all") return todos;
  if (filter === "completed") return todos.filter((todo) => todo.completed);
  if (filter === "pending") return todos.filter((todo) => !todo.completed);
}
