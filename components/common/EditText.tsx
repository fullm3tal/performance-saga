import React, { forwardRef } from "react";
import { Platform, Text, TextInput, TextInputProps, View } from "react-native";

interface EditTextProps extends TextInputProps {
  label: string;
}

export const EditText = React.memo(
  forwardRef<any, EditTextProps>(function EditTextImpl(
    { label }: EditTextProps,
    ref
  ) {
    console.log("Edit Text" + label);

    return (
      <View>
        <View
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
        >
          <TextInput style={{ width: "100%" }} placeholder={label} ref={ref} />
        </View>
        <Text style={{}}>Hello World</Text>
        <Text>Hello World</Text>
        <Text>Hello World</Text>
        <Text>Hello World</Text>
        <Text>Hello World</Text>
        <Text>Hello World</Text>
      </View>
    );
  })
);
