import { Platform, Pressable, Text } from "react-native";

export const Card = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      style={{
        marginTop: 6,
        width: "96%",
        height: 50,
        alignSelf: "center",
        borderWidth: 0.2,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderColor: "black",
        borderBottomWidth: Platform.OS == "ios" ? 1.5 : 1,
        borderBottomColor: "red",
        flexDirection: "row",
        backgroundColor: "white",
      }}
      onPress={onPress}
    >
      <Text>{label}</Text>
    </Pressable>
  );
};
