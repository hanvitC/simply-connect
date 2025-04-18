import React, { forwardRef } from 'react';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { FirebaseOptions } from 'firebase/app';

interface RecaptchaVerifierProps {
  firebaseConfig: FirebaseOptions;
  attemptInvisibleVerification?: boolean;
  title?: string;
  cancelLabel?: string;
  languageCode?: string;
}

const RecaptchaVerifier = forwardRef<FirebaseRecaptchaVerifierModal, RecaptchaVerifierProps>(
  ({ 
    firebaseConfig,
    attemptInvisibleVerification = true,
    title = "Verify phone number",
    cancelLabel = "Cancel",
    languageCode = "en"
  }, ref) => {
    return (
      <FirebaseRecaptchaVerifierModal
        ref={ref}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={attemptInvisibleVerification}
        title={title}
        cancelLabel={cancelLabel}
        languageCode={languageCode}
      />
    );
  }
);

RecaptchaVerifier.displayName = 'RecaptchaVerifier';

export default RecaptchaVerifier;