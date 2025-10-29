import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TagIcon, UserIcon, SpinnerIcon } from './IconComponents';

interface HeaderProps {
  onLoginClick: () => void;
}

const SearchBar: React.FC = () => {
    const { performSearch, isSearching, searchHistory, clearSearchHistory, currentUser } = useAppContext();
    const [query, setQuery] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Effect to handle clicks outside of the search bar to close the history dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsHistoryVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            performSearch(query.trim());
            setIsHistoryVisible(false); // Hide history on submit
        }
    };
    
    const handleHistoryClick = (searchTerm: string) => {
        setQuery(searchTerm);
        performSearch(searchTerm);
        setIsHistoryVisible(false);
    };

    const handleClearHistory = () => {
        clearSearchHistory();
        // Keep the dropdown open to show it's empty, it will close on blur/click-out
    };

    return (
        <div ref={searchContainerRef} className="relative w-full max-w-lg">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsHistoryVisible(true)}
                    placeholder="e.g., 'vintage dresses under $50'"
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    aria-label="Conversational search input"
                />
                <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-10 text-gray-500 hover:text-indigo-600 disabled:text-gray-400"
                    aria-label="Submit search"
                >
                    {isSearching ? <SpinnerIcon className="w-5 h-5" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            </form>

            {isHistoryVisible && currentUser && (
                 <div className="absolute top-full mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {searchHistory.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
                                <span className="text-sm font-semibold text-gray-700">Recent Searches</span>
                                <button onMouseDown={handleClearHistory} className="text-xs text-indigo-600 hover:underline focus:outline-none">Clear</button>
                            </div>
                            <ul className="py-1 max-h-60 overflow-y-auto">
                                {searchHistory.map((item, index) => (
                                    <li key={index}>
                                        <button 
                                            onMouseDown={() => handleHistoryClick(item)} 
                                            className="w-full text-left px-4 py-2 text-gray-600 hover:bg-indigo-50"
                                        >
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                         <div className="px-4 py-3 text-sm text-center text-gray-500">
                            No recent searches.
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { currentUser, logout, setCurrentView, wishlist } = useAppContext();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 flex-wrap gap-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentView({ name: 'browse' })}
          >
            <TagIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-800">Closet Swap AI</span>
          </div>
          <div className="flex-grow flex justify-center min-w-[300px]">
            <SearchBar />
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <button onClick={() => setCurrentView({ name: 'profile', userId: currentUser.id })} className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600">
                  <div className="relative">
                    <UserIcon className="w-5 h-5" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white ring-2 ring-white">
                        {wishlist.length}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{currentUser.name}</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
         <div className="hidden md:flex items-center justify-center space-x-8 h-12 border-t border-gray-200">
            <button onClick={() => setCurrentView({ name: 'browse' })} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Browse</button>
            {currentUser?.type === 'seller' && (
              <button onClick={() => setCurrentView({ name: 'sell' })} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Sell</button>
            )}
            {currentUser?.isAdmin && (
              <button onClick={() => setCurrentView({ name: 'admin' })} className="text-red-600 hover:text-red-800 font-medium transition-colors">Admin Dashboard</button>
            )}
          </div>
      </div>
    </header>
  );
};

export default Header;