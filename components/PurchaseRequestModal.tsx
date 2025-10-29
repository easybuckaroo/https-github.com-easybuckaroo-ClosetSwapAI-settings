import React, { useState } from 'react';
import type { Product } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({ isOpen, onClose, product }) => {
  const { addPurchaseRequest } = useAppContext();
  const [minBid, setMinBid] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseFloat(minBid);
    const max = parseFloat(maxBid);

    if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
        setError('Please enter valid, non-negative bid amounts.');
        return;
    }
    if (max < min) {
      setError('Your maximum bid must be greater than or equal to your minimum bid.');
      return;
    }
    setError('');
    addPurchaseRequest(product.id, min, max, comment);
    onClose();
  };
  
  const handleClose = () => {
    // Reset state on close
    setMinBid('');
    setMaxBid('');
    setComment('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 m-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Place Your Bid</h2>
          <p className="text-gray-600 mb-4">You are bidding on: <span className="font-semibold">{product.title}</span>.</p>
          <p className="text-sm text-gray-500 mb-6">Enter the minimum you're willing to pay and the maximum you'll go. We'll automatically bid for you up to your maximum. The seller will review all bids and choose a buyer.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="minBid" className="block text-sm font-medium text-gray-700">Minimum Bid</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                      type="number"
                      id="minBid"
                      value={minBid}
                      onChange={(e) => setMinBid(e.target.value)}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 pl-7 pr-4 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., 50.00"
                  />
              </div>
            </div>
             <div>
              <label htmlFor="maxBid" className="block text-sm font-medium text-gray-700">Maximum Bid</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                      type="number"
                      id="maxBid"
                      value={maxBid}
                      onChange={(e) => setMaxBid(e.target.value)}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 pl-7 pr-4 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., 75.00"
                  />
              </div>
            </div>
          </div>
          {error && <p className="mb-4 text-sm text-center text-red-600">{error}</p>}
          
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment for Seller (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={`Leave a note for ${product.sellerName}...`}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Submit Bid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRequestModal;