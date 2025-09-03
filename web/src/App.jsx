import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import Onboarding from "./components/Onboarding";
import Signup from "./components/Signup";
import Login from './components/Login';
import ProfileSetup from "./components/ProfileSetup";
import HomeSwiping from "./components/HomeSwiping";
import Chat from "./components/Chat";
import GiftStore from "./components/GiftStore";
import NavigationBar from "./components/NavigationBar";
import Profile from "./components/Profile";
import Matches from "./components/Matches";
import Settings from "./components/Settings";
import Upgrade from "./components/Upgrade";
import PurchasePage from './components/PurchasePage';
import PurchaseSuccess from './components/PurchaseSuccess';
import useDarkMode from "./hooks/useDarkMode";
import { FiLoader } from 'react-icons/fi';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Chatbot from './components/Chatbot';
import api from "./api.js"; 

export default function App() {
  const [step, setStep] = useState(0); 
  const [showGift, setShowGift] = useState(false);
  const [nav, setNav] = useState("home");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDark, setIsDark] = useDarkMode();
  const [isLoading, setIsLoading] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const [matches, setMatches] = useState([
    {
      id: 1,
      name: "Alex",
      age: 27,
      avatar: "/alex.png",
      lastMessage: "Hey there!",
      unread: true,
      messages: [
        { fromMe: false, text: "Hey there! 😊", time: "09:20" },
        { fromMe: true, text: "Hi Alex! How are you?", time: "09:21" },
      ],
    },
    {
      id: 2,
      name: "Sam",
      age: 24,
      avatar: "/sam.png",
      lastMessage: "Let's meet up!",
      unread: false,
      messages: [
        { fromMe: false, text: "Let's meet up!", time: "10:00" },
      ],
    },
  ]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleAuthentication = (user, token) => {
    if (user && token) {
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setAuthToken(token);
      setShowLogin(false); 
      
      if (user.profile_completeness_score < 100) {
        setStep(3);
      } else {
        setStep(4);
      }
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      const path = window.location.pathname;
      const hash = window.location.hash || '';

      // Persist any tx_ref-like parameter found in the URL as an additional fallback
      try {
        const sp = new URLSearchParams(window.location.search || '');
        const directRef = sp.get('tx_ref') || sp.get('trx_ref') || sp.get('reference') || sp.get('transaction_id') || sp.get('transactionId');
        if (directRef) {
          localStorage.setItem('last_tx_ref', directRef);
        } else if (hash) {
          const hashBody = hash.replace(/^#\/?/, '');
          const queryPart = hashBody.includes('?') ? hashBody.split('?')[1] : hashBody;
          if (queryPart && queryPart.includes('=')) {
            const hp = new URLSearchParams(queryPart);
            const refFromHash = hp.get('tx_ref') || hp.get('trx_ref') || hp.get('reference') || hp.get('transaction_id') || hp.get('transactionId');
            if (refFromHash) {
              localStorage.setItem('last_tx_ref', refFromHash);
            }
          }
        }
      } catch (_) {}

      try {
        if (token) {
          const response = await api.get('/user/me/');
          const user = response.data;
          
          setCurrentUser(user);
          setAuthToken(token);
          // Determine whether we should show purchase success
          const sp = new URLSearchParams(window.location.search || '');
          const directRef = sp.get('tx_ref') || sp.get('trx_ref') || sp.get('reference') || sp.get('transaction_id') || sp.get('transactionId');
          const hashBody = hash.replace(/^#\/?/, '');
          const queryPart = hashBody.includes('?') ? hashBody.split('?')[1] : hashBody;
          const hp = new URLSearchParams(queryPart || '');
          const refFromHash = hp.get('tx_ref') || hp.get('trx_ref') || hp.get('reference') || hp.get('transaction_id') || hp.get('transactionId');
          const statusParam = (sp.get('status') || hp.get('status') || '').toLowerCase();
          const shouldGoPurchaseSuccess = path.startsWith('/purchase-success') || hash.includes('purchase-success') || !!directRef || !!refFromHash || statusParam === 'success' || statusParam === 'successful';

          if (shouldGoPurchaseSuccess) {
            setNav('purchase-success');
            setStep(4);
          } else if (user.profile_completeness_score < 100) { 
            setStep(3);
          } else {
            setStep(4);
          }
        } else {
          const hasOnboarded = localStorage.getItem('hasOnboarded');
          setStep(hasOnboarded ? 2 : 1);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setAuthToken(null);
        setCurrentUser(null);
        setStep(2);
      } finally {
        setIsLoading(false);
      }
    };

    const splashTimeout = setTimeout(() => {
      initializeApp();
    }, 1500);

    return () => clearTimeout(splashTimeout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthToken(null);
    setStep(2);
    setNav('home');
  };

  const handleProfileSave = (updatedUserData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...updatedUserData,
      // Ensure nested objects like user_photos are also updated if they exist in the payload
      user_photos: updatedUserData.user_photos || prevUser.user_photos,
    }));
  };

  React.useEffect(() => {
    if (selectedMatch) {
      const updated = matches.find(m => m.id === selectedMatch.id);
      if (updated) setSelectedMatch(updated);
    }
  }, [matches]);

  const handleProfileSetupFinish = async (profileData, preferenceData) => {
    setIsLoading(true);
    try {
      await api.patch('/user/me/', profileData);
      await api.patch('/user/preferences/', preferenceData);

      const updatedUserResponse = await api.get('/user/me/');
      setCurrentUser(updatedUserResponse.data);

      setStep(4);
    } catch (error) {
      console.error("Error finishing profile setup:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyForAuth = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setStep(2);
  };

  const handleSendMessage = async (text) => {
    if (!selectedMatch) return;

    const newMessage = { fromMe: true, text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    const updatedMatches = matches.map(m => m.id === selectedMatch.id ? { ...m, messages: [...(m.messages || []), newMessage] } : m);
    setMatches(updatedMatches);

    try {
      await api.post(`/matches/${selectedMatch.id}/send_message/`, { text: text });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSendGift = (gift) => {
    const giftMessage = `You sent a ${gift.name}!`;
    handleSendMessage(giftMessage);
  };

  const renderContent = () => {
    if (step === 0 || isLoading) {
      return <SplashScreen />;
    }

    const signupPage = (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Signup onLogin={() => setShowLogin(true)} onContinue={handleAuthentication} />
        </div>
      </div>
    );

    switch (step) {
      case 1:
        return <Onboarding onFinish={handleReadyForAuth} />;
      case 2:
        return signupPage;
      case 3:
        if (!authToken) {
          return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin text-4xl text-primary" /></div>;
        }
        return <ProfileSetup currentUser={currentUser} authToken={authToken} onFinish={handleProfileSetupFinish} />;
      case 4:
        return (
          <div className="flex flex-col">
            <div className="flex-1 min-h-0">
              {nav === "home" && <HomeSwiping onMatch={() => setStep(5)} onGift={() => setShowGift(true)} />}
              {nav === "matches" && <Matches matches={matches} onChat={match => { setSelectedMatch(match); setStep(5); }} />}
              {nav === "purchase" && <PurchasePage currentUser={currentUser} />}
              {nav === "purchase-success" && <PurchaseSuccess onNavigate={setNav} />}
              {nav === "profile" && <Profile user={currentUser} onSave={handleProfileSave} />}
              {nav === "settings" && <Settings onLogout={handleLogout} onUpgrade={() => setShowUpgrade(true)} isDark={isDark} onToggleDark={() => setIsDark(d => !d)} />}
            </div>
            {/* Spacer to ensure content clears the fixed NavigationBar */}
            <div className="h-28 md:h-32" aria-hidden="true" />
            <NavigationBar current={nav} onNavigate={setNav} />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col h-full">
            <Chat match={selectedMatch} onBack={() => setStep(4)} onGift={() => setShowGift(true)} onSendMessage={handleSendMessage} />
          </div>
        );
      default:
        return signupPage;
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className={`bg-white dark:bg-gray-900 transition-colors duration-300 flex flex-col min-h-screen`}>
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full max-h-full overflow-y-auto">
              <Login onSignup={() => setShowLogin(false)} onContinue={handleAuthentication} />
              <button onClick={() => setShowLogin(false)} className="mt-4 w-full text-center text-gray-500 dark:text-gray-400 hover:underline">Close</button>
            </div>
          </div>
        )}
        <main className={`flex-grow min-h-0 ${step >= 4 ? 'overflow-visible pb-40' : 'overflow-y-auto'}`}>{renderContent()}</main>
        {showGift && <GiftStore onClose={() => setShowGift(false)} onSend={handleSendGift} />}
        {showUpgrade && <Upgrade onClose={() => setShowUpgrade(false)} />}
        {authToken && (
          <>
            <button onClick={() => setIsChatbotOpen(true)} className="fixed bottom-5 right-5 bg-fuchsia-600 text-white p-4 rounded-full shadow-lg hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 z-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>
            {isChatbotOpen && <Chatbot authToken={authToken} onClose={() => setIsChatbotOpen(false)} />}
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}