const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  expo: {
    name: "HeyVoca",
    slug: "vocaandgo_app",
    version: "1.1.2",
    scheme: "HeyVoca",
    platforms: ["ios", "android"],
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ghmate.vocaandgo",
      versionCode: 5,
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "HeyVoca",
              host: "auth"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"],
          autoVerify: true
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: process.env.PROJECT_ID,
        googleClientId: process.env.GOOGLE_CLIENT_ID,
      }
    },
    owner: "whrksp126"
  }
};
