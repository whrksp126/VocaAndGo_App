import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, BackHandler, Alert, ToastAndroid, AppRegistry } from 'react-native';
import { WebView } from 'react-native-webview';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ANDROID_ID, GOOGLE_CLIENT_WEB_ID } from '@env';

GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_WEB_ID,
  androidClientId: GOOGLE_CLIENT_ANDROID_ID,
  offlineAccess: true,
});

const App = () => {
  const FRONT_URL = `https://voca.ghmate.com`;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const webViewRef = useRef(null);
  const [lastBackPressed, setLastBackPressed] = useState(0);

  const handleMessage = (event) => {
    const message = event.nativeEvent.data;
    if (message === 'launchGoogleAuth') {
      signInWithGoogle();
    } else if (message === 'logoutGoogleAuth') {
      signOutWithGoogle();
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

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      Alert.alert('', '로그인 성공', [{ text: 'OK' }], { cancelable: false });
      if (webViewRef.current) {
        const newUrl = `${FRONT_URL}/html/login.html?token=${userInfo.idToken}&email=${userInfo.user.email}&name=${userInfo.user.name}&status=200`;
        const script = `window.location.href = '${newUrl}';`;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (error) {
      handleSignInError(error);
    }
  };

  const handleSignInError = (error) => {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      Alert.alert('', '사용자가 로그인 흐름을 취소했습니다', [{ text: 'OK' }], { cancelable: false });
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert('', '로그인 진행 중', [{ text: 'OK' }], { cancelable: false });
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('', 'Play 서비스를 사용할 수 없거나 오래되었습니다', [{ text: 'OK' }], { cancelable: false });
    } else {
      Alert.alert('', `로그인 실패,${error}`, [{ text: 'OK' }], { cancelable: false });
      console.error('로그인 실패: ', error);
    }
  };

  const signOutWithGoogle = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('로그아웃 실패: ', error);
    }
  };

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
        source={{ uri: `${FRONT_URL}` }}
        ref={webViewRef}
        javaScriptEnabled={true}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        userAgent="HeyVoca"
        injectedJavaScript={`
          window.alert = function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'alert', message: message }));
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

// 여기서 앱을 등록합니다.
AppRegistry.registerComponent('main', () => App);

export default App;
