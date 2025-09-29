'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Howl } from 'howler';

interface SoundContextType {
  playCompletionSound: () => void;
  playPreCompletionSound: () => void;
  playDecrementSound: () => void;
  playFeelingSelectSound: () => void;
  playFeelingDeselectSound: () => void;
  unlockAudioContext: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [completionSound, setCompletionSound] = useState<Howl | null>(null);
  const [preCompletionSound, setPreCompletionSound] = useState<Howl | null>(null);
  const [decrementSound, setDecrementSound] = useState<Howl | null>(null);
  const [feelingSelectSound, setFeelingSelectSound] = useState<Howl | null>(null);
  const [feelingDeselectSound, setFeelingDeselectSound] = useState<Howl | null>(null);

  useEffect(() => {
    // Load user's sound preference from localStorage
    const savedSoundPreference = localStorage.getItem('kinisi_sound_enabled');
    if (savedSoundPreference !== null) {
      setIsSoundEnabled(JSON.parse(savedSoundPreference));
    }

    // Initialize completion sound with better audio handling
    const completionSoundInstance = new Howl({
      src: ['/assets/sounds/complete_1.mp3'],
      preload: true,
      volume: 0.6, // Set a reasonable default volume
      html5: false, // Use Web Audio API instead of HTML5 audio to prevent pop sounds
      onloaderror: function(id, error) {
        console.warn('Completion sound failed to load:', error);
      },
      onplayerror: function(id, error) {
        console.warn('Completion sound playback error:', error);
        // Handle audio context unlock - Howler.js will automatically retry
      }
    });

    // Initialize pre-completion sound with better audio handling
    const preCompletionSoundInstance = new Howl({
      src: ['/assets/sounds/complete_pre.mp3'],
      preload: true,
      volume: 0.5, // Slightly lower volume for pre-completion
      html5: false, // Use Web Audio API instead of HTML5 audio to prevent pop sounds
      onloaderror: function(id, error) {
        console.warn('Pre-completion sound failed to load:', error);
      },
      onplayerror: function(id, error) {
        console.warn('Pre-completion sound playback error:', error);
        // Handle audio context unlock - Howler.js will automatically retry
      }
    });

    // Initialize decrement sound with better audio handling
    const decrementSoundInstance = new Howl({
      src: ['/assets/sounds/complete_decrement.mp3'],
      preload: true,
      volume: 0.4, // Lower volume for decrement actions
      html5: false, // Use Web Audio API instead of HTML5 audio to prevent pop sounds
      onloaderror: function(id, error) {
        console.warn('Decrement sound failed to load:', error);
      },
      onplayerror: function(id, error) {
        console.warn('Decrement sound playback error:', error);
        // Handle audio context unlock - Howler.js will automatically retry
      }
    });

    // Initialize feeling select sound with better audio handling
    const feelingSelectSoundInstance = new Howl({
      src: ['/assets/sounds/feeling_select.mp3'],
      preload: true,
      volume: 0.5, // Moderate volume for feeling selection
      html5: false, // Use Web Audio API instead of HTML5 audio to prevent pop sounds
      onloaderror: function(id, error) {
        console.warn('Feeling select sound failed to load:', error);
      },
      onplayerror: function(id, error) {
        console.warn('Feeling select sound playback error:', error);
        // Handle audio context unlock - Howler.js will automatically retry
      }
    });

    // Initialize feeling deselect sound with better audio handling
    const feelingDeselectSoundInstance = new Howl({
      src: ['/assets/sounds/feeling_deselect.mp3'],
      preload: true,
      volume: 0.4, // Lower volume for feeling deselection
      html5: false, // Use Web Audio API instead of HTML5 audio to prevent pop sounds
      onloaderror: function(id, error) {
        console.warn('Feeling deselect sound failed to load:', error);
      },
      onplayerror: function(id, error) {
        console.warn('Feeling deselect sound playback error:', error);
        // Handle audio context unlock - Howler.js will automatically retry
      }
    });

    setCompletionSound(completionSoundInstance);
    setPreCompletionSound(preCompletionSoundInstance);
    setDecrementSound(decrementSoundInstance);
    setFeelingSelectSound(feelingSelectSoundInstance);
    setFeelingDeselectSound(feelingDeselectSoundInstance);

    // Cleanup on unmount
    return () => {
      completionSoundInstance.unload();
      preCompletionSoundInstance.unload();
      decrementSoundInstance.unload();
      feelingSelectSoundInstance.unload();
      feelingDeselectSoundInstance.unload();
    };
  }, []);

  // Function to sync with profile setting (called from account page)
  const syncWithProfile = (enabled: boolean) => {
    setIsSoundEnabled(enabled);
    localStorage.setItem('kinisi_sound_enabled', JSON.stringify(enabled));
  };

  // Expose sync function through window for account page access
  useEffect(() => {
    (window as { kinisiSyncSound?: (enabled: boolean) => void }).kinisiSyncSound = syncWithProfile;
    return () => {
      delete (window as { kinisiSyncSound?: (enabled: boolean) => void }).kinisiSyncSound;
    };
  }, []);

  // Unlock audio context on first user interaction to prevent pop sounds
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    // Add event listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [completionSound, preCompletionSound, decrementSound, feelingSelectSound, feelingDeselectSound]);

  const playCompletionSound = () => {
    if (isSoundEnabled && completionSound) {
      completionSound.play();
    }
  };

  const playPreCompletionSound = () => {
    if (isSoundEnabled && preCompletionSound) {
      preCompletionSound.play();
    }
  };

  const playDecrementSound = () => {
    if (isSoundEnabled && decrementSound) {
      decrementSound.play();
    }
  };

  const playFeelingSelectSound = () => {
    if (isSoundEnabled && feelingSelectSound) {
      feelingSelectSound.play();
    }
  };

  const playFeelingDeselectSound = () => {
    if (isSoundEnabled && feelingDeselectSound) {
      feelingDeselectSound.play();
    }
  };

  // Function to trigger audio context unlock on first user interaction
  const unlockAudioContext = () => {
    // Howler.js automatically handles audio context unlocking
    // This function is kept for potential future use
    console.log('Audio context unlock triggered');
  };

  const toggleSound = () => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem('kinisi_sound_enabled', JSON.stringify(newValue));
  };

  const setSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabled(enabled);
    localStorage.setItem('kinisi_sound_enabled', JSON.stringify(enabled));
  };

  const value: SoundContextType = {
    playCompletionSound,
    playPreCompletionSound,
    playDecrementSound,
    playFeelingSelectSound,
    playFeelingDeselectSound,
    unlockAudioContext,
    isSoundEnabled,
    toggleSound,
    setSoundEnabled,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};
