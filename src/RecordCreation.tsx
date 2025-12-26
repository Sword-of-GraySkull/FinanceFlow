import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Account, Transaction } from './lib/supabase';

type TabKey = 'expense' | 'income' | 'transfer';

interface RecordCreationProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  accounts: Account[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

// Auto-categorization rules derived from provided mapping
const AUTO_CATEGORIZATION_RULES: Array<{ keyword: string; category: string }> = [
  { keyword: 'atm', category: 'Cash Withdrawal' },
  { keyword: 'bank charge', category: 'Bank Charges' },
  { keyword: 'cloth', category: 'Clothing' },
  { keyword: 'footwear', category: 'Clothing' },
  { keyword: 'shoe', category: 'Clothing' },
  { keyword: 'cinema', category: 'Entertainment' },
  { keyword: 'activity', category: 'Entertainment' },
  { keyword: 'outing', category: 'Entertainment' },
  { keyword: 'grocery', category: 'Grocery' },
  { keyword: 'super bazaar', category: 'Grocery' },
  { keyword: 'swiggy', category: 'Food' },
  { keyword: 'zomato', category: 'Food' },
  { keyword: 'restaurant', category: 'Food' },
  { keyword: 'hotel', category: 'Food' },
  { keyword: 'eat', category: 'Food' },
  { keyword: 'tea', category: 'Food' },
  { keyword: 'icecream', category: 'Food' },
  { keyword: 'pizza', category: 'Food' },
  { keyword: 'snack', category: 'Food' },
  { keyword: 'fruit', category: 'Food' },
  { keyword: 'coffee', category: 'Food' },
  { keyword: 'furnishing', category: 'Furnishing' },
  { keyword: 'electrical', category: 'Furnishing' },
  { keyword: 'home good', category: 'Home Goods' },
  { keyword: 'mobile', category: 'Gadgets' },
  { keyword: 'headset', category: 'Gadgets' },
  { keyword: 'gift', category: 'Gift' },
  { keyword: 'sgb', category: 'Gold' },
  { keyword: 'goldbees', category: 'Gold' },
  { keyword: 'gold', category: 'Gold' },
  { keyword: 'hair cut', category: 'Grooming' },
  { keyword: 'rent', category: 'House Rent' },
  { keyword: 'rental advance', category: 'House Rent' },
  { keyword: 'stock', category: 'Investments' },
  { keyword: 'mutual', category: 'Investments' },
  { keyword: 'zerodha', category: 'Investments' },
  { keyword: 'kite', category: 'Investments' },
  { keyword: 'coin', category: 'Investments' },
  { keyword: 'upstox', category: 'Investments' },
  { keyword: 'angel', category: 'Investments' },
  { keyword: 'groww', category: 'Investments' },
  { keyword: 'ppf', category: 'Investments' },
  { keyword: 'medical', category: 'Medical' },
  { keyword: 'moving', category: 'Misc' },
  { keyword: 'umbrella', category: 'Misc' },
  { keyword: 'misc', category: 'Misc' },
  { keyword: 'internet', category: 'Mobile & Internet' },
  { keyword: 'sim', category: 'Mobile & Internet' },
  { keyword: 'airtel', category: 'Mobile & Internet' },
  { keyword: 'vodafone', category: 'Mobile & Internet' },
  { keyword: 'jio', category: 'Mobile & Internet' },
  { keyword: 'toilteries', category: 'Toilteries and Household' },
  { keyword: 'toilet cleaning', category: 'Cleaning charges' },
  { keyword: 'house cleaning', category: 'Cleaning charges' },
  { keyword: 'trip', category: 'Travel' },
  { keyword: 'tour', category: 'Travel' },
  { keyword: 'emergency', category: 'Unexpected' },
  { keyword: 'unexpected', category: 'Unexpected' },
  { keyword: 'waste tax', category: 'Utility Bills' },
  { keyword: 'fuel', category: 'Utility Bills' },
  { keyword: 'power', category: 'Utility Bills' },
  { keyword: 'gas', category: 'Utility Bills' },
  { keyword: 'water bill', category: 'Utility Bills' },
  { keyword: 'water tax', category: 'Utility Bills' },
  { keyword: 'electricity', category: 'Utility Bills' },
  { keyword: 'eb', category: 'Utility Bills' },
  { keyword: 'share auto', category: 'Transport' },
  { keyword: 'bus', category: 'Transport' },
  { keyword: 'metro', category: 'Transport' },
  { keyword: 'auto', category: 'Transport' },
  { keyword: 'mobile recharge', category: 'Internet Recharge' },
  { keyword: 'wifi recharge', category: 'Internet Recharge' },
  { keyword: 'donation', category: 'Donation' },
  { keyword: 'split', category: 'Split Settlements' },
];

const INCOME_CATEGORIES: string[] = [
  'Salary',
  'Investments',
  'Part-Time',
  'Bonus',
  'Others',
];


export default function RecordCreation({ isOpen, onClose, accounts, onSaveTransaction }: RecordCreationProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('expense');
  const [amount, setAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [destinationAccount, setDestinationAccount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomPanelOpen, setIsCustomPanelOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [categoryManuallyChosen, setCategoryManuallyChosen] = useState<boolean>(false);
  const [parentCategory, setParentCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const expenseCategories = Array.from(new Set(AUTO_CATEGORIZATION_RULES.map(r => r.category))).sort();
  const availableCategories = activeTab === 'expense' ? expenseCategories : activeTab === 'income' ? INCOME_CATEGORIES : [];

  function getActiveRules(): Array<{ keyword: string; category: string }> {
    const dynamicCategoryRules = availableCategories.map(c => ({ keyword: c.toLowerCase(), category: c }));
    return [...AUTO_CATEGORIZATION_RULES, ...dynamicCategoryRules];
  }

  function suggestCategoryFromName(value: string) {
    if (categoryManuallyChosen) return;
    const lower = value.toLowerCase();
    const match = getActiveRules().find(rule => lower.includes(rule.keyword));
    if (match) setCategory(match.category);
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl outline outline-1 -outline-offset-1 outline-gray-100 transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-xl data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="px-6 py-5">
              <div className="sm:flex sm:items-start">
                <div className="mt-1 sm:mt-0 sm:text-left w-full">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                    Create Record
                  </DialogTitle>

                  {/* Tabs */}
                  <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('expense')}
                        className={`${activeTab === 'expense' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium`}
                      >
                        Expense
                      </button>
                      <button
                        onClick={() => setActiveTab('income')}
                        className={`${activeTab === 'income' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium`}
                      >
                        Income
                      </button>
                      <button
                        onClick={() => setActiveTab('transfer')}
                        className={`${activeTab === 'transfer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium`}
                      >
                        Transfer
                      </button>
                    </nav>
                  </div>

                  {/* Amount input */}
                  <div className="mt-6">
                    <div className="flex items-center justify-center bg-blue-600 text-white rounded-xl py-10 px-4">
                      <div className="text-5xl font-semibold mr-4 select-none">
                        {activeTab === 'expense' ? '-' : activeTab === 'income' ? '+' : ''}
                      </div>
                      <input
                        inputMode="decimal"
                        className="bg-transparent text-white text-6xl font-bold outline-none w-full text-center tracking-tight"
                        placeholder='0'
                        value={amount}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, '');
                          // Remove leading zeros (except if value is '0' or starts with '0.' for decimals)
                          value = value.replace(/^0+(?!\.|$)/, '');
                          setAmount(value === '' ? '0' : value);
                        }}
                      />
                      <div className="ml-3 text-xl opacity-90">INR</div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent text-gray-500 text-sm font-medium focus:outline-none border-b border-gray-200 pb-1"
                      />
                    </div>
                  </div>

                  {/* Name/Description */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder={activeTab === 'income' ? 'Salary, Refund...' : 'Grocery, Fuel, Airtel...'}
                      value={name}
                      onChange={(e) => { const v = e.target.value; setName(v); suggestCategoryFromName(v); }}
                    />
                  </div>

                  {/* Selectors */}
                  {activeTab !== 'transfer' && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                      >
                        <option value="">Select Account</option>
                        {accounts.map((a) => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={category}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCategory(value);
                          setCategoryManuallyChosen(true);
                          if (value === '__custom') {
                            setIsCustomPanelOpen(true);
                          }
                        }}
                      >
                        <option value="">Select Category</option>
                        {availableCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__custom">+ Add Custom...</option>
                      </select>
                      {name && category && category !== '__custom' && (
                        <p className="mt-1 text-xs text-gray-500">Suggested: {category}</p>
                      )}
                    </div>
                  </div>
                  )}

                  {activeTab === 'transfer' && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source Account</label>
                        <select
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={sourceAccount}
                          onChange={(e) => {
                            setSourceAccount(e.target.value);
                            if (e.target.value === destinationAccount) setDestinationAccount('');
                          }}
                        >
                          <option value="">Select Source</option>
                          {accounts.map((a) => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Account</label>
                        <select
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                        >
                          <option value="">Select Destination</option>
                          {accounts
                            .filter(a => a.name !== sourceAccount)
                            .map((a) => (
                              <option key={a.name} value={a.name}>{a.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Sliding custom category panel */}
                  <div className={`mt-6 overflow-hidden transition-all duration-300 ${isCustomPanelOpen ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">Create Custom Category</h4>
                        <button
                          type="button"
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => setIsCustomPanelOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                          <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="e.g. Dining"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            value={parentCategory}
                            onChange={(e) => setParentCategory(e.target.value)}
                          >
                            <option value="">None</option>
                            {availableCategories.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                          onClick={() => {
                            // For now, just set and close panel; wiring to data store will follow
                            if (customCategory) {
                              setCategory(customCategory);
                              setIsCustomPanelOpen(false);
                              setCategoryManuallyChosen(true);
                            }
                          }}
                        >
                          Add Category
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onClose(false)}
                      className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                      onClick={() => {
                        const transactionAmount = parseFloat(amount) || 0;
                        const transactionType = activeTab === 'transfer' ? 'transfer' : activeTab as 'income' | 'expense';
                        
                        // Validation
                        if (transactionAmount <= 0) {
                          alert('Please enter a valid amount');
                          return;
                        }
                        
                        if (activeTab !== 'transfer' && !selectedAccount) {
                          alert('Please select an account');
                          return;
                        }
                        
                        if (activeTab === 'transfer' && (!sourceAccount || !destinationAccount)) {
                          alert('Please select both source and destination accounts');
                          return;
                        }
                        
                        
                        const transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
                          date: date,
                          description: name || 'Untitled',
                          amount: transactionType === 'expense' ? -transactionAmount : transactionAmount,
                          category: activeTab === 'transfer' ? 'Transfer' : (category || 'Uncategorized'),
                          type: transactionType,
                          account: activeTab !== 'transfer' ? selectedAccount : undefined,
                          source_account: activeTab === 'transfer' ? sourceAccount : undefined,
                          destination_account: activeTab === 'transfer' ? destinationAccount : undefined,
                        };
                        
                        onSaveTransaction(transaction);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}


