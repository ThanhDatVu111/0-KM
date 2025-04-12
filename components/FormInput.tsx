import {View, Text, StyleSheet, TextInput, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
    label:string;
    borderColor?: string;
}

export default function FormInput({label, borderColor, ...props}: FormInputProps) {
    return (
        <View style = {styles.container}>
            <Text style = {styles.label}>{label}</Text>
            <TextInput {...props} style = {[styles.input ,props.style, {borderColor: borderColor}]}/>
        </View>
    )
}

const styles = StyleSheet.create({
    label:{
        textAlign: 'left', marginBottom: 10 
    },

    container: {
       marginBottom: 10,
    },

    input: {
        fontSize: 16,
        borderWidth: 2, padding: 10, borderRadius:4, marginBottom: 10, color: '#7D7E83',
    }
})