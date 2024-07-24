import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, BackHandler, Alert, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const webViewRef = useRef(null);
  const [lastBackPressed, setLastBackPressed] = useState(0);

  const handleAuth = async () => {
    const authUrl = 'https://vocaandgo.ghmate.com/login/google';
    const result = await WebBrowser.openAuthSessionAsync(authUrl);

    if (result.type === 'success' && result.url) {
      // 브라우저 팝업을 종료합니다.
      WebBrowser.dismissAuthSession();
      // URL에서 토큰을 추출합니다.
      const { token, email, name, status } = Linking.parse(result.url).queryParams;
      // WebView로 인증 정보를 전달합니다.
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'authSuccess',
          token,
          email,
          name,
          status
        }));
      }
    }
  };

  useEffect(() => {
    const handleUrl = (event) => {
      console.log("Received URL from event: ", event.url); // 이벤트로 받은 URL 로그 출력
      const { token, email, name, status } = Linking.parse(event.url).queryParams;
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'authSuccess',
          token,
          email,
          name,
          status
        }));
      }
    };

    Linking.addEventListener('url', handleUrl);

    return () => {
      Linking.removeEventListener('url', handleUrl);
    };
  }, []);

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
      handleAuth();
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
