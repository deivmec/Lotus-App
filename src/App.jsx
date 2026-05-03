import { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';
import './styles/global.css';

import Login       from './screens/Login';
import Home        from './screens/Home';
import Tasks       from './screens/Tasks';
import Pessoal     from './screens/Pessoal';
import Mais        from './screens/Mais';
import Compras     from './screens/Compras';
import Financas    from './screens/Financas';
import Calendario  from './screens/Calendario';
import Saude       from './screens/Saude';
import Cofre       from './screens/Cofre';
import Viagem      from './screens/Viagem';
import Conteudo    from './screens/Conteudo';
import Portfolio   from './screens/Portfolio';
import Inspiracao  from './screens/Inspiracao';
import Utilitarios from './screens/Utilitarios';
import Notificacoes from './screens/Notificacoes';
import Receitas    from './screens/Receitas';
import Idiomas     from './screens/Idiomas';
import LinksRapidos from './screens/LinksRapidos';
import Capilar        from './screens/Capilar';
import Autocuidados   from './screens/Autocuidados';
import Perfil      from './screens/Perfil';
import Busca       from './screens/Busca';

const MAIN_TABS = ['home', 'tasks', 'pessoal', 'mais'];

const SUB_SCREENS = {
  compras:      Compras,
  financas:     Financas,
  calendario:   Calendario,
  saude:        Saude,
  cofre:        Cofre,
  viagem:       Viagem,
  conteudo:     Conteudo,
  portfolio:    Portfolio,
  inspiracao:   Inspiracao,
  utilitarios:  Utilitarios,
  notificacoes: Notificacoes,
  receitas:     Receitas,
  idiomas:      Idiomas,
  links:        LinksRapidos,
  capilar:      Capilar,
  autocuidados: Autocuidados,
  perfil:       Perfil,
  busca:        Busca,
};

const Shell = ({ children, activeTab, onTabChange, subScreen, userName }) => {
  const navActive = subScreen || activeTab;

  return (
    <div className="app-shell">
      <Sidebar active={navActive} onChange={onTabChange} userName={userName} />
      <div className="main-content-desktop">
        <main className="scroll-area">
          {children}
        </main>
      </div>
      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
};

const AppContent = () => {
  const { authed, loading, userName, login, signup, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [subScreen, setSubScreen] = useState(null);

  useEffect(() => {
    if (subScreen) {
      window.scrollTo?.(0, 0);
    }
  }, [subScreen, activeTab]);

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="app-shell">
        <Login onLogin={login} onSignup={signup} />
      </div>
    );
  }

  const handleTabChange = (id) => {
    if (MAIN_TABS.includes(id)) {
      setActiveTab(id);
      setSubScreen(null);
    } else {
      setSubScreen(id);
    }
  };

  const handleBack = () => setSubScreen(null);

  const renderScreen = () => {
    if (subScreen) {
      const SubComponent = SUB_SCREENS[subScreen];
      if (!SubComponent) return null;
      const extraProps = subScreen === 'perfil'
        ? { onLogout: logout, onUpdateUser: updateUser }
        : {};
      return <SubComponent onBack={handleBack} onNav={handleTabChange} {...extraProps} />;
    }
    switch (activeTab) {
      case 'home':    return <Home onNav={handleTabChange} userName={userName} />;
      case 'tasks':   return <Tasks />;
      case 'pessoal': return <Pessoal />;
      case 'mais':    return <Mais onNav={handleTabChange} />;
      default:        return <Home onNav={handleTabChange} userName={userName} />;
    }
  };

  return (
    <Shell activeTab={activeTab} onTabChange={handleTabChange} subScreen={subScreen} userName={userName}>
      {renderScreen()}
    </Shell>
  );
};

const App = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
