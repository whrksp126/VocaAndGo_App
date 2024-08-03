import 'dotenv/config';

export default {
  expo: {
    name: "HeyVoca",
    slug: "vocaandgo_app",
    version: "1.1.3",
    scheme: "HeyVoca",
    platforms: [
      "web",
      "android",
      "ios"
    ],
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ghmate.vocaandgo",
      versionCode: 6
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.example.temp",
      config: {
        googleSignIn: {
          reservedClientId: process.env.IOS_URL_SCHEME
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b3f71d2a-824b-4c8b-93e6-7207ab16f5fe"
      }
    },
    owner: "whrksp126",
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          androidClientId: process.env.GOOGLE_CLIENT_ANDROID_ID,
          webClientId: process.env.GOOGLE_CLIENT_WEB_ID,
          iosUrlScheme: process.env.IOS_URL_SCHEME
        }
      ]
    ]
  }
};