import { AntDesign, Entypo, Feather, Ionicons, Octicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { Menu, MenuProvider, MenuOptions, MenuTrigger, MenuOption } from 'react-native-popup-menu';

const Divider = () => <View className="h-px my-1 bg-#F24187" />;

const Reply = () => (
  <MenuOption
    onSelect={() => console.log(`User replying`)}
    customStyles={{
      optionWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
    }}
  >
    <Text>Reply</Text>
    <Octicons name="reply" size={24} color="#F24187" />
  </MenuOption>
);

const Edit = () => (
  <MenuOption
    onSelect={() => console.log(`User editing`)}
    customStyles={{
      optionWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
    }}
  >
    <Text>Edit</Text>
    <Feather name="edit-2" size={24} color="#F24187" />
  </MenuOption>
);

const Copy = () => (
  <MenuOption
    onSelect={() => console.log(`User copied text`)}
    customStyles={{
      optionWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
    }}
  >
    <Text>Copy</Text>
    <Feather name="copy" size={24} color="#F24187" />
  </MenuOption>
);

const Delete = () => (
  <MenuOption
    onSelect={() => console.log(`User deleting messages for themselves`)}
    customStyles={{
      optionWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
    }}
  >
    <Text>Delete for You</Text>
    <AntDesign name="delete" size={24} color="#F24187" />
  </MenuOption>
);

const Unsend = () => (
  <MenuOption
    onSelect={() => console.log(`User unsending`)}
    customStyles={{
      optionWrapper: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
    }}
  >
    <Text>Unsend</Text>
    <Ionicons name="arrow-undo-circle-outline" size={24} color="#F24187" />
  </MenuOption>
);

export default function ChatContextMenu() {
  return (
    <MenuProvider
      style={{
        flex: 1,
        backgroundColor: '#fff',
        marginVertical: 100,
        marginHorizontal: 100,
      }}
    >
      <Menu>
        <MenuTrigger
          customStyles={{
            triggerWrapper: {
              top: -20,
            },
          }}
        >
          <Entypo name="dots-three-horizontal" size={24} color="#F24187" />
        </MenuTrigger>
        <MenuOptions
          customStyles={{
            optionsContainer: {
              borderRadius: 10,
            },
          }}
        >
          <Reply />
          <Divider />

          <Copy />
          <Divider />

          <Edit />
          <Divider />

          <Delete />
          <Divider />

          <Unsend />
        </MenuOptions>
      </Menu>
    </MenuProvider>
  );
}
