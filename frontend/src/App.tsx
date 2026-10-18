import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { Navbar } from './components/Navbar';
import { Loader2 } from 'lucide-react';

type PageRoute = 'landing' | 'signin' | 'signup' | 'dashboard' | 'workspace';

const MainRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<PageRoute>('landing');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('workspace/')) {
        const docId = hash.replace('workspace/', '');
        setSelectedDocId(docId);
        setRoute('workspace');
      } else if (hash === 'dashboard') {
        setSelectedDocId(null);
        setRoute('dashboard');
      } else if (hash === 'signin') {
        setRoute('signin');
      } else if (hash === 'signup') {
        setRoute('signup');
      } else if (!user) {
        setRoute('landing');
      } else {
        setRoute('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Not logged in routes
  if (!user) {
    if (route === 'signin') {
      return (
        <SignInPage
          onNavigateSignUp={() => {
            window.location.hash = '#/signup';
          }}
          onNavigateHome={() => {
            window.location.hash = '#/';
          }}
          onSuccess={() => {
            window.location.hash = '#/dashboard';
          }}
        />
      );
    }
    if (route === 'signup') {
      return (
        <SignUpPage
          onNavigateSignIn={() => {
            window.location.hash = '#/signin';
          }}
          onNavigateHome={() => {
            window.location.hash = '#/';
          }}
          onSuccess={() => {
            window.location.hash = '#/dashboard';
          }}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => {
          window.location.hash = '#/signup';
        }}
        onSignIn={() => {
          window.location.hash = '#/signin';
        }}
      />
    );
  }

  // Authenticated routes
  if (route === 'workspace' && selectedDocId) {
    return (
      <WorkspacePage
        documentId={selectedDocId}
        onBackToDashboard={() => {
          setSelectedDocId(null);
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <DashboardPage
          onSelectDocument={docId => {
            setSelectedDocId(docId);
            window.location.hash = `#/workspace/${docId}`;
          }}
        />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
