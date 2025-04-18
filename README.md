# Simply Connect - Social Connection App

A React Native mobile app built with Expo and Firebase for connecting people through shared experiences.

## Features

- 📱 Phone number authentication
- 👥 User profiles and connections
- 📝 Post creation and sharing
- 🔔 Activity notifications
- 🤝 Friend management

## Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project credentials

## Environment Setup

1. Clone the repository
2. Create a `.env` file in the root directory with your Firebase configuration:

```
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_auth_domain_here
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
FIREBASE_APP_ID=your_app_id_here
FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the app
   ```bash
   npx expo start
   ```

You can run the app on:
- iOS Simulator
- Android Emulator (experimental)
- Physical device via Expo Go app 
- Web browser (experimental)

## Project Structure

```
simply-connect/
├── app/                      # App screens and navigation
│   ├── _layout.tsx          # Root layout & authentication
│   ├── index.tsx            # Entry point
│   ├── (auth)/              # Auth-related screens
│   │   ├── login.tsx        # Phone input screen
│   │   └── verify.tsx       # OTP verification
│   └── (tabs)/              # Main app tabs
│       ├── home.tsx         # Post feed
│       ├── friends.tsx      # Connections
│       ├── post.tsx         # Create post
│       ├── activity.tsx     # Notifications
│       └── profile.tsx      # User profile
├── components/              # Reusable components
│   ├── PostCard.tsx        # Post display
│   └── RecaptchaVerifier.tsx # Phone auth component
├── config/
│   └── firebase.ts         # Firebase configuration
├── constants/
│   └── Colors.ts           # Theme colors
├── services/
│   └── postService.ts      # Post-related operations
├── styles/                 # Shared styles
└── types/                  # TypeScript definitions
```

## Development

- This project uses [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- Firebase is used for authentication and data storage
- TypeScript is used for type safety
- Follows file-based routing convention

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Documentation](https://reactnative.dev/)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
