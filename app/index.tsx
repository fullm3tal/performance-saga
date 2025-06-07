import { useEffect, useState } from "react";
import { Button, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [showForm, setShowForm] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button
        title="Click Me"
        onPress={() => {
          setShowForm((prev) => !prev);
        }}
      />
      {showForm ? <FormWrong /> : null}
    </SafeAreaView>
  );
}

function FormWrong() {
  const [firstName, setFirstName] = useState("Taylor");
  const [lastName, setLastName] = useState("Swift");

  // ❌ Unnecessary extra state
  const [fullName, setFullName] = useState("");

  // ❌ Unnecessary useEffect
  useEffect(() => {
    setFullName(firstName + " " + lastName);
  }, [firstName, lastName]);

  return (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Text style={{ fontSize: 20 }}>Full Name: {fullName}</Text>
    </SafeAreaView>
  );
}

function FormRight() {
  const [firstName, setFirstName] = useState("Taylor");
  const [lastName, setLastName] = useState("Swift");
  // ✅ Just calculate during render
  const fullName = firstName + " " + lastName;

  return (
    <SafeAreaView style={{ padding: 16 }}>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Text style={{ fontSize: 20 }}>Full Name: {fullName}</Text>
    </SafeAreaView>
  );
}
