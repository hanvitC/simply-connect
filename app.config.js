// Load environment variables
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.resolve(__dirname, '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key.trim()] = value.trim();
    }
  });
}

// Ensure all required environment variables are present
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

for (const envVar of requiredEnvVars) {
  if (!envVars[envVar]) {
    console.warn(`Warning: Missing environment variable: ${envVar}`);
  }
}

export default {
  expo: {
    name: 'simply-connect',
    slug: 'simply-connect',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.simplyconnect.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.simplyconnect.app'
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-firebase-core",
        {
          "projectId": process.env.FIREBASE_PROJECT_ID,
          "apiKey": process.env.FIREBASE_API_KEY,
          "messagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
          "appId": process.env.FIREBASE_APP_ID,
          "measurementId": process.env.FIREBASE_MEASUREMENT_ID
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    }
  }
};