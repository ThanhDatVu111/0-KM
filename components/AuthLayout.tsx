import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';

interface AuthLayoutProps{
    children: React.ReactNode;
    activeTab: 'sign-in' | 'sign-up';
    onTabChange: (tab: 'sign-in' | 'sign-up' | 'forgot-password'
    ) => void;
}

export default function AuthLayout({children, activeTab, onTabChange}: AuthLayoutProps) {
    return (
        <View style = {styles.container}>
            <Image source={require('../assets/images/logo.png')} style = {styles.logo}/>
            <Text style = {styles.tagline}>Love knows no distance</Text>
            <View style = {styles.tabContainer}>
                <TouchableOpacity onPress = {() => onTabChange('sign-in')}>
                    <Text style = {[styles.tab, activeTab === 'sign-in' && styles.activeTab]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress = {() => onTabChange('sign-up')}>
                    <Text style = {[styles.tab, activeTab === 'sign-up' && styles.activeTab]}>Create Account</Text>
                </TouchableOpacity>
            </View>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems:'center',
        flex:1,
        backgroundColor: '#F5CDDE',
    },

    logo:{
        width: 100,
        height: 58,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems:'center',
    },

    tagline :{
        fontFamily: 'Poppins-Light',
        fontSize: 18,
        fontWeight: 'light',
        color: '000000',
        textAlign: 'center',
        marginBottom: 30,
    },

    tab:{
        fontSize: 18,
        color: '#FF4081',
        paddingHorizontal: 30,
        paddingBottom: 5,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    
    activeTab:{
        fontWeight: 'bold',
        borderBottomColor: 'F5829B',
    },

    tabContainer:{
        flexDirection: 'row',
        marginBottom: 20,
    }
})