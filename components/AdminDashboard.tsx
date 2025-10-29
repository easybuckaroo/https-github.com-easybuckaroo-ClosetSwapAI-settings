import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { User, Product } from '../types';

const AdminDashboard: React.FC = () => {
  const { 
    users, 
    allProducts,
    suspendUser, 
    reinstateUser, 
    reviewReportedItem, 
    reviewReportedUser,
    setCurrentView,
  } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('users');

  const reportedProducts = allProducts.filter(p => p.reportedNSFW);
  const reportedUsers = users.filter(u => u.reportedNSFW);
  // Exclude the admin user from the main user list
  const regularUsers = users.filter(u => !u.isAdmin);

  const renderUsers = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200">
        {regularUsers.map((user: User) => (
          <li key={user.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-indigo-600 truncate">
                {user.name}
                <p className="text-gray-500 font-normal">{user.email}</p>
                <p className="text-gray-500 font-normal capitalize">Type: {user.type}</p>
              </div>
              <div className="ml-2 flex-shrink-0 flex space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isSuspended ? 'bg-red-100 text-red-800' : 
                  user.reportedNSFW ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {user.isSuspended ? 'Suspended' : user.reportedNSFW ? 'Reported' : 'Active'}
                </span>
                {user.isSuspended ? (
                  <button onClick={() => reinstateUser(user.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Reactivate</button>
                ) : (
                  <button onClick={() => suspendUser(user.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Suspend</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderReportedContent = (type: 'items' | 'users') => {
    const items = type === 'items' ? reportedProducts : reportedUsers;
    if (items.length === 0) {
      return <p className="text-gray-500">No {type} have been reported.</p>;
    }
    
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {items.map((item: Product | User) => (
            <li key={item.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {'title' in item ? item.title : item.name}
                  </p>
                  <p 
                    className="text-sm text-gray-500 hover:underline cursor-pointer" 
                    onClick={() => setCurrentView({name: 'profile', userId: 'sellerId' in item ? item.sellerId : item.id})}
                  >
                    by {'sellerName' in item ? item.sellerName : item.name}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0 flex space-x-2">
                  <button onClick={() => {
                      type === 'items' ? reviewReportedItem(item.id, 'dismiss') : reviewReportedUser(item.id, 'dismiss')
                  }} className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600">Dismiss</button>
                  <button onClick={() => {
                      type === 'items' ? reviewReportedItem(item.id, 'confirm') : reviewReportedUser(item.id, 'confirm')
                  }} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Confirm NSFW</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const tabs = [
    { id: 'users', label: 'Manage Users' },
    { id: 'reported-items', label: `Reported Items (${reportedProducts.length})` },
    { id: 'reported-users', label: `Reported Users (${reportedUsers.length})` },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'reported-items' && renderReportedContent('items')}
        {activeTab === 'reported-users' && renderReportedContent('users')}
      </div>
    </div>
  );
};

export default AdminDashboard;