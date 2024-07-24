import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, BackHandler, Alert, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const webViewRef = useRef(null);
  const [lastBackPressed, setLastBackPressed] = useState(0);

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    scheme: 'HeyVoca'

  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '',
      scopes: ['profile', 'email', 'openid', 'https://www.googleapis.com/auth/drive.file'],
      redirectUri,
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Auth code:', code);
      webViewRef.current.injectJavaScript(`handleAuthSuccess('${code}')`);
    }
  }, [response]);

  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            const isBackable = is_backable();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'isBackable', value: isBackable }));
          })();
        `);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [lastBackPressed]);

  const handleMessage = (event) => {
    const message = event.nativeEvent.data;
    if (message === 'launchGoogleAuth') {
      promptAsync();
    } else {
      try {
        const data = JSON.parse(message);
        if (data.type === 'alert') {
          Alert.alert('', data.message, [{ text: 'OK' }], { cancelable: false });
        } else if (data.type === 'isBackable') {
          if (data.value) {
            webViewRef.current.goBack();
          } else {
            handleExitApp();
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  };

  const handleExitApp = () => {
    const now = Date.now();
    if (lastBackPressed && (now - lastBackPressed) < 2000) {
      BackHandler.exitApp();
    } else {
      ToastAndroid.show('Press back again to exit.', ToastAndroid.SHORT);
      setLastBackPressed(now);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#000' : '#fff'} />
      <WebView
        source={{ uri: 'https://voca.ghmate.com' }}
        ref={webViewRef}
        javaScriptEnabled={true}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        injectedJavaScript={`
          window.alert = function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'alert', message: message }));
          };
          document.querySelector('.google_btn').onclick = function() {
            window.ReactNativeWebView.postMessage('launchGoogleAuth');
          };
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});