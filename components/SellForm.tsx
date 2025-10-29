import React, { useState, useRef } from 'react';
import { generateProductDescription, checkNSFWContent, suggestPrice, analyzeImageForListing, PriceSuggestionResult, ListingAnalysisResult, suggestShippingCost } from '../services/geminiService';
import type { Product, ProductCondition } from '../types';
import { SparklesIcon, SpinnerIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

const productConditions: ProductCondition[] = ['New with tags', 'Like new', 'Good', 'Fair'];
const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'NSFW'];

interface DamageEntry {
    description: string;
    imageUrls: string[];
}

const SellForm: React.FC = () => {
  const { addItem, currentUser, allProducts } = useAppContext();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState<ProductCondition>('Good');
  const [price, setPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isSuggestingShipping, setIsSuggestingShipping] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(90);
  
  // State for damage documentation
  const [damageList, setDamageList] = useState<DamageEntry[]>([]);
  const [currentDamageDesc, setCurrentDamageDesc] = useState('');
  const [currentDamageImageUrls, setCurrentDamageImageUrls] = useState<string[]>([]);
  const [isUploadingDamage, setIsUploadingDamage] = useState(false);
  const damageFileInputRef = useRef<HTMLInputElement>(null);

  const getExpiryDatePreview = () => {
    const date = new Date();
    date.setDate(date.getDate() + (expiresInDays || 0));
    return date.toLocaleDateString();
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyzeImage = async () => {
    if (!imagePreviewUrl) {
        alert("Please upload an image first.");
        return;
    }
    setIsAnalyzingImage(true);
    const result: ListingAnalysisResult = await analyzeImageForListing(imagePreviewUrl, categories);
    setTitle(result.title);
    setCategory(result.category);
    setDescription(result.description);
    setIsAnalyzingImage(false);
  };

  const handleGenerateDescription = async () => {
    if (!title) {
        alert("Please enter a title for your item first.");
        return;
    }
    setIsGeneratingDesc(true);
    const generatedDesc = await generateProductDescription(title, category, condition);
    setDescription(generatedDesc);
    setIsGeneratingDesc(false);
  };

  const handleSuggestPrice = async () => {
    if (!title) {
        alert("Please enter a title for your item first.");
        return;
    }
    setIsSuggestingPrice(true);
    setPriceSuggestion(null);
    const suggestion = await suggestPrice(title, category, condition, description, allProducts);
    setPriceSuggestion(suggestion);
    setIsSuggestingPrice(false);
  };
  
  const handleSuggestShipping = async () => {
    if (!title && !description) {
        alert("Please provide a title and/or description for your item first.");
        return;
    }
    setIsSuggestingShipping(true);
    const { suggestedShippingCost } = await suggestShippingCost(title, category, description);
    if (suggestedShippingCost > 0) {
        setShippingCost(suggestedShippingCost.toFixed(2));
    }
    setIsSuggestingShipping(false);
  };

  const handleDamageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setIsUploadingDamage(true);
        const files = Array.from(e.target.files);
        const uploadedUrls: string[] = [];
        let filesProcessed = 0;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                uploadedUrls.push(reader.result as string);
                filesProcessed++;
                if (filesProcessed === files.length) {
                    setCurrentDamageImageUrls(prev => [...prev, ...uploadedUrls]);
                    setIsUploadingDamage(false);
                }
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const handleAddDamage = () => {
    if (!currentDamageDesc) {
        alert("Please provide a description for the damage.");
        return;
    }
    setDamageList(prev => [...prev, { description: currentDamageDesc, imageUrls: currentDamageImageUrls }]);
    setCurrentDamageDesc('');
    setCurrentDamageImageUrls([]);
  };

  const handleRemoveDamage = (indexToRemove: number) => {
    setDamageList(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleRemoveCurrentDamageImage = (indexToRemove: number) => {
    setCurrentDamageImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.type !== 'seller') {
        alert('You must be a seller to list an item.');
        return;
    }
    if (!title || !price || !shippingCost || !imagePreviewUrl) {
      alert('Please fill out all required fields (Title, Price, Shipping Cost, and Image).');
      return;
    }

    setIsSubmitting(true);
    
    const isFlaggedByAI = await checkNSFWContent(title, description, imagePreviewUrl);
    if (isFlaggedByAI && !isNSFW) {
        if (!confirm("Our AI has flagged this listing as potentially NSFW. To proceed, you must mark it as NSFW. Do you want to mark it and continue?")) {
            setIsSubmitting(false);
            return;
        }
    }

    const finalIsNSFW = isNSFW || isFlaggedByAI;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const newItem: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'status' | 'createdAt'> = {
      title,
      description,
      price: parseFloat(price),
      reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
      imageUrl: imagePreviewUrl,
      category,
      condition,
      shippingCost: parseFloat(shippingCost),
      isNSFW: finalIsNSFW,
      documentedDamage: damageList.length > 0 ? damageList : undefined,
      expiresAt,
    };
    
    addItem(newItem, isFlaggedByAI);

    // Resetting form is good practice, though we navigate away.
    setTitle('');
    setDescription('');
    setPrice('');
    setReservePrice('');
    setShippingCost('');
    setImagePreviewUrl('');
    setCategory(categories[0]);
    setCondition('Good');
    setIsNSFW(false);
    setDamageList([]);
    setExpiresInDays(90);
    setIsSubmitting(false);
  };
  
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">List a New Item</h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload & AI Analysis */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Image*</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {imagePreviewUrl ? (
                                    <img src={imagePreviewUrl} alt="Preview" className="mx-auto h-48 w-auto rounded-md object-contain" />
                                ) : (
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        {imagePreviewUrl && (
                             <button
                                type="button"
                                onClick={handleAnalyzeImage}
                                disabled={isAnalyzingImage}
                                className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                            >
                                {isAnalyzingImage ? <SpinnerIcon /> : <SparklesIcon />}
                                <span className="ml-2">Analyze Image with AI</span>
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>

                    {/* Category & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category*</label>
                            <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition*</label>
                            <select id="condition" value={condition} onChange={e => setCondition(e.target.value as ProductCondition)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                                {productConditions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !title} className="mt-2 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400">
                             {isGeneratingDesc ? <SpinnerIcon /> : <SparklesIcon />}
                            <span className="ml-2">Generate with AI</span>
                        </button>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price*</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 25.00" required />
                        </div>
                        <div>
                            <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700">Reserve Price (Optional)</label>
                            <input type="number" id="reservePrice" value={reservePrice} onChange={e => setReservePrice(e.target.value)} min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 20.00" />
                        </div>
                        <div>
                            <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700">Shipping Cost*</label>
                            <input type="number" id="shippingCost" value={shippingCost} onChange={e => setShippingCost(e.target.value)} min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="e.g., 5.00" required />
                        </div>
                    </div>

                     {/* Pricing Helpers */}
                     <div className="flex space-x-4">
                        <button type="button" onClick={handleSuggestPrice} disabled={isSuggestingPrice || !title} className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                            {isSuggestingPrice ? <SpinnerIcon /> : <SparklesIcon />}
                            <span className="ml-2">Suggest Price</span>
                        </button>
                         <button type="button" onClick={handleSuggestShipping} disabled={isSuggestingShipping || (!title && !description)} className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                            {isSuggestingShipping ? <SpinnerIcon /> : <SparklesIcon />}
                            <span className="ml-2">Suggest Shipping</span>
                        </button>
                     </div>
                     {priceSuggestion && (
                         <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                            <p className="text-sm text-indigo-800">
                                <span className="font-semibold">AI Price Suggestion:</span> ${priceSuggestion.suggestedPriceLow.toFixed(2)} - ${priceSuggestion.suggestedPriceHigh.toFixed(2)}
                            </p>
                            <p className="text-xs text-indigo-700 mt-1 italic">{priceSuggestion.reasoning}</p>
                         </div>
                     )}

                    {/* Listing Duration */}
                    <div className="border-t pt-8">
                        <h3 className="text-lg font-medium text-gray-900">Listing Duration</h3>
                        <p className="text-sm text-gray-500 mt-1">Set how long your item will be available for purchase.</p>
                        <div className="mt-4">
                            <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700">Duration (1-365 days)</label>
                            <input 
                                type="number" 
                                id="expiresInDays" 
                                value={expiresInDays} 
                                onChange={e => {
                                    const val = Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1));
                                    setExpiresInDays(val);
                                }} 
                                min="1" 
                                max="365" 
                                className="mt-1 block w-full md:w-1/3 border-gray-300 rounded-md shadow-sm" 
                                required 
                            />
                            <p className="text-xs text-gray-500 mt-1">Your listing will expire on {getExpiryDatePreview()}.</p>
                        </div>
                    </div>

                    {/* Damage Documentation */}
                    <div className="border-t pt-8">
                      <h3 className="text-lg font-medium text-gray-900">Document Imperfections (Optional)</h3>
                      <p className="text-sm text-gray-500 mt-1">Be transparent about any stains, tears, or other damage. This builds trust with buyers.</p>
                      
                      <div className="mt-4 space-y-4">
                          {damageList.map((damage, index) => (
                              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-md border">
                                  <div>
                                      <p className="text-sm font-medium">{damage.description}</p>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                          {damage.imageUrls.map((url, i) => <img key={i} src={url} alt={`Damage ${index + 1} image ${i + 1}`} className="w-16 h-16 rounded object-cover border" />)}
                                      </div>
                                  </div>
                                  <button type="button" onClick={() => handleRemoveDamage(index)} className="text-red-500 hover:text-red-700 font-bold ml-4 flex-shrink-0">&times;</button>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 p-4 border border-dashed rounded-md space-y-4">
                          <textarea value={currentDamageDesc} onChange={e => setCurrentDamageDesc(e.target.value)} rows={2} className="block w-full border-gray-300 rounded-md shadow-sm" placeholder="Describe the imperfection..."/>
                          <div className="flex items-center flex-wrap gap-2">
                            {currentDamageImageUrls.map((url, i) => (
                                <div key={i} className="relative">
                                    <img src={url} alt={`Damage detail preview ${i + 1}`} className="w-16 h-16 rounded object-cover border" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCurrentDamageImage(i)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-colors"
                                        aria-label="Remove image"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                              <button type="button" onClick={() => damageFileInputRef.current?.click()} disabled={isUploadingDamage} className="text-sm text-indigo-600 hover:underline">
                                  {isUploadingDamage ? <SpinnerIcon /> : 'Add Damage Photos'}
                              </button>
                              <input type="file" ref={damageFileInputRef} onChange={handleDamageImageUpload} multiple accept="image/*" className="hidden"/>
                              <button type="button" onClick={handleAddDamage} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Add Entry</button>
                          </div>
                      </div>
                    </div>


                    {/* NSFW Checkbox */}
                    <div className="border-t pt-8">
                        <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                                <input
                                    id="nsfw-checkbox"
                                    aria-describedby="nsfw-description"
                                    name="nsfw"
                                    type="checkbox"
                                    checked={isNSFW}
                                    onChange={(e) => setIsNSFW(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="nsfw-checkbox" className="font-medium text-gray-700">
                                    Mark as NSFW
                                </label>
                                <p id="nsfw-description" className="text-gray-500">
                                    (For mature audiences). Check this box if your item is sexually suggestive, explicit, or otherwise inappropriate for a general audience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-6 border-t">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                            {isSubmitting ? <SpinnerIcon className="mx-auto" /> : 'List My Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellForm;