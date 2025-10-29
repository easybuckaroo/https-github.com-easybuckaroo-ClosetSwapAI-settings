import React, { useState } from 'react';
import { AppProvider, useAppContext, View } from './contexts/AppContext';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import LoginModal from './components/LoginModal';
import SellForm from './components/SellForm';
import UserProfile from './components/UserProfile';
import ProductDetailView from './components/ProductDetailView';
import AdminDashboard from './components/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentView, users, products, currentUser } = useAppContext();
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  const renderView = () => {
    switch (currentView.name) {
      case 'browse':
        return <ProductGrid />;
      case 'sell':
        if (!currentUser || currentUser.type !== 'seller') {
          return <div className="text-center py-10">You must be logged in as a seller to list items.</div>;
        }
        return <SellForm />;
      case 'profile':
        const user = users.find(u => u.id === currentView.userId);
        if (!user) {
          return <div className="text-center py-10">User not found.</div>;
        }
        return <UserProfile user={user} />;
      case 'productDetail':
        const product = products.find(p => p.id === currentView.productId);
         if (!product) {
          return <div className="text-center py-10">Product not found.</div>;
        }
        return <ProductDetailView product={product} />;
      case 'admin':
        if (!currentUser?.isAdmin) {
            return <div className="text-center py-10">Access Denied.</div>;
        }
        return <AdminDashboard />;
      default:
        return <ProductGrid />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setLoginModalOpen(true)} />
      <main className="flex-grow">
        {renderView()}
      </main>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
       <footer className="bg-gray-100 border-t">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Closet Swap AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;