import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, useColorScheme, BackHandler, Alert, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const colorScheme = useColorScheme(); // 시스템 테마 조회
  const isDarkMode = colorScheme === 'dark';

  const webViewRef = useRef(null);
  const [lastBackPressed, setLastBackPressed] = useState(0); // 마지막 백 버튼 누른 시간

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
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'alert') {
        // alert 메시지를 네이티브 Alert로 처리하여 제목을 제거
        Alert.alert('', data.message, [{ text: '확인' }], { cancelable: false });
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
  };

  const handleExitApp = () => {
    const now = Date.now();
    if (lastBackPressed && (now - lastBackPressed) < 2000) {
      BackHandler.exitApp(); // 2초 이내에 다시 호출되면 앱 종료
    } else {
      ToastAndroid.show(`'뒤로' 버튼을 한 번 더 누르면 종료됩니다.`, ToastAndroid.SHORT);
      setLastBackPressed(now); // 현재 시간을 저장
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <WebView
        source={{ uri: 'https://voca.ghmate.com' }}
        ref={webViewRef}
        javaScriptEnabled={true}
        bounces={false}  // iOS에서 스크롤 바운스 비활성화
        overScrollMode="never" // Android에서 스크롤 바운스 비활성화
        onMessage={handleMessage}
        injectedJavaScript={`
          // JavaScript에서 alert 함수를 오버라이드하여 네이티브 앱으로 메시지 전달
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
