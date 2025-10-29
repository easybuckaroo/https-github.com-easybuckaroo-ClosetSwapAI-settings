import React, { useState } from 'react';
import type { User, Transaction } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { StarIcon } from './IconComponents';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  targetUser: User;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, transaction, targetUser }) => {
  const { addReview } = useAppContext();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    addReview(transaction.id, targetUser.id, rating, comment);
    onClose();
  };
  
  const handleClose = () => {
    // Reset state on close
    setRating(0);
    setHoverRating(0);
    setComment('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 m-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Leave a Review</h2>
          <p className="text-gray-600 mb-4">You are reviewing <span className="font-semibold">{targetUser.name}</span> for the item: <span className="font-semibold">{transaction.productTitle}</span>.</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <button
                    type="button"
                    key={starValue}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-yellow-400 focus:outline-none"
                    aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                  >
                    <StarIcon 
                      className="w-8 h-8" 
                      filled={starValue <= (hoverRating || rating)} 
                    />
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={`Share your experience with ${targetUser.name}...`}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;