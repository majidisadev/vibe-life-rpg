import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { UserProvider } from './contexts/UserContext';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Trackings from './pages/Trackings';
import Media from './pages/Media';
import Characters from './pages/Characters';
import Settings from './pages/Settings';
import FantasyWorld from './pages/FantasyWorld';
import Gallery from './pages/Gallery';
import Dungeons from './pages/Dungeons';
import Town from './pages/Town';
import Blacksmith from './pages/Blacksmith';
import Market from './pages/Market';
import Gacha from './pages/Gacha';
import Layout from './components/Layout';

function App() {
  return (
    <UserProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/trackings" element={<Trackings />} />
            <Route path="/media" element={<Media />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/fantasy-world" element={<FantasyWorld />} />
            <Route path="/fantasy-world/gallery" element={<Gallery />} />
            <Route path="/dungeons" element={<Dungeons />} />
            <Route path="/town" element={<Town />} />
            <Route path="/blacksmith" element={<Blacksmith />} />
            <Route path="/market" element={<Market />} />
            <Route path="/gacha" element={<Gacha />} />
          </Routes>
        </Layout>
        <Toaster 
          position="bottom-right" 
          richColors 
          toastOptions={{
            duration: 5000,
            closeButton: true,
          }}
        />
      </Router>
    </UserProvider>
  );
}

export default App;

