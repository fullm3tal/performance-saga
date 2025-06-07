import { useEffect, useState } from "react";
import { Button, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("123");

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button
        title="Click Me"
        onPress={() => {
          setShowForm((prev) => !prev);
        }}
      />
      <Button
        title="Switch User"
        onPress={() => setUserId(userId === "123" ? "456" : "123")}
      />
      <ProfilePageRight userId={userId} key={userId} />
    </SafeAreaView>
  );
}
function ProfilePage({ userId }: { userId: string }) {
  const [comment, setComment] = useState("");

  // 🔴 Inefficient: reset state using Effect
  useEffect(() => {
    setComment("");
  }, [userId]);

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text>User ID: {userId}</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Write a comment..."
        style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
      />
    </SafeAreaView>
  );
}

function ProfilePageRight({ userId }: { userId: string }) {
  return <Profile key={userId} userId={userId} />;
}

// ✅ Inner component
function Profile({ userId }: { userId: string }) {
  const [comment, setComment] = useState("");

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text>User ID: {userId}</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Write a comment..."
        style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
      />
    </SafeAreaView>
  );
}
