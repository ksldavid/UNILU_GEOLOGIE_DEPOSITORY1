import React, { useState, useEffect } from 'react';
import { BackHandler, Linking } from 'react-native';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { SplashScreen } from './screens/SplashScreen';
import { TermsScreen } from './screens/TermsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './services/notification';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { extractTokenFromURL, isAttendanceQRLink } from './utils/deepLinkHandler';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [isLoading, setIsLoading] = useState(true);
  const [deepLinkToken, setDeepLinkToken] = useState<string | null>(null);

  // 🆕 Gérer les deep links (QR code scanné avec l'appareil photo)
  useEffect(() => {
    // Gérer le lien initial (app fermée, ouverte via deep link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && isAttendanceQRLink(initialUrl)) {
        handleDeepLink(initialUrl);
      }
    };

    // Gérer les liens entrants (app déjà ouverte)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isAttendanceQRLink(url)) {
        handleDeepLink(url);
      }
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    const token = extractTokenFromURL(url);

    if (token) {
      // Vérifier si l'utilisateur est connecté
      const userSession = await AsyncStorage.getItem('userSession');
      const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedTerms');

      if (userSession && hasAcceptedTerms === 'true') {
        // Utilisateur connecté : ouvrir directement le scanner avec le token
        setDeepLinkToken(token);
        setCurrentScreen('scanner');
      } else {
        // Utilisateur non connecté : sauvegarder le token pour après connexion
        await AsyncStorage.setItem('pendingQRToken', token);
        setDeepLinkToken(token);
      }
    }
  };

  // Initialiser les notifications si on est sur la home
  useEffect(() => {
    if (currentScreen === 'home') {
      notificationService.init();

      // Vérifier s'il y a un token en attente après connexion
      checkPendingQRToken();
    }
  }, [currentScreen]);

  const checkPendingQRToken = async () => {
    const pendingToken = await AsyncStorage.getItem('pendingQRToken');
    if (pendingToken) {
      await AsyncStorage.removeItem('pendingQRToken');
      setDeepLinkToken(pendingToken);
      setCurrentScreen('scanner');
    }
  };

  // Gérer le bouton retour Android
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'scanner') {
        goBackFromScanner();
        return true; // Empêche la fermeture de l'app
      }
      if (currentScreen === 'home' || currentScreen === 'login') {
        // Sur home ou login, on laisse le comportement par défaut (fermer l'app)
        return false;
      }
      return true; // Empêche la fermeture sur les autres écrans
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen]);

  const checkAuthStatus = async () => {
    try {
      const userSession = await AsyncStorage.getItem('userSession');
      const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedTerms');

      if (userSession) {
        const parsed = JSON.parse(userSession);
        if (parsed.token && hasAcceptedTerms === 'true') {
          setCurrentScreen('home');
        } else if (parsed.token) {
          setCurrentScreen('terms');
        } else {
          // Si pas de token, on force le login
          setCurrentScreen('login');
        }
      } else {
        setCurrentScreen('login');
      }
    } catch (e) {
      setCurrentScreen('login');
    } finally {
      setIsLoading(false);
    }
  };

  const goToHome = () => {
    setCurrentScreen('home');
  };

  const handleLoginSuccess = async () => {
    const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedTerms');
    if (hasAcceptedTerms === 'true') {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('terms');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userSession');
    setCurrentScreen('login');
  };

  const goToScanner = () => {
    setDeepLinkToken(null); // Reset le token si on ouvre manuellement
    setCurrentScreen('scanner');
  };

  const goBackFromScanner = () => {
    setDeepLinkToken(null); // Reset le token
    setCurrentScreen('home');
  };

  const handleSplashComplete = () => {
    checkAuthStatus();
  };

  const handleTermsAccepted = () => {
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    if (currentScreen === 'splash') {
      return <SplashScreen onAnimationComplete={handleSplashComplete} />;
    }

    if (currentScreen === 'terms') {
      return <TermsScreen onAccept={handleTermsAccepted} />;
    }

    if (currentScreen === 'home') {
      return <HomeScreen onLogout={handleLogout} onOpenScanner={goToScanner} />;
    }

    if (currentScreen === 'scanner') {
      return <ScannerScreen navigation={{ goBack: goBackFromScanner }} deepLinkToken={deepLinkToken} />;
    }

    return (
      <LoginScreen onLogin={handleLoginSuccess} />
    );
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
}
