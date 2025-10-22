import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  Target, 
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { parseFile, FileParseResult } from './utils/fileParser';
import Accounts from './Accounts/accounts';
import RecordCreation from './RecordCreation';
import { formatINR } from './utils/currency';
import { accountService, transactionService } from './lib/database';
import { Account, Transaction } from './lib/supabase';
import AssetDistributionChart from './components/AssetDistributionChart';

function App() {
  // Accounts state - now using Supabase
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Transactions state - now using Supabase
  const [recordedTransactions, setRecordedTransactions] = useState<Transaction[]>([]);
  
  // Other state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'insights' | 'transactions'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [isRecordCreationOpen, setIsRecordCreationOpen] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [txSearch, setTxSearch] = useState('');

  // Load accounts and transactions on component mount
  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await transactionService.getAll();
      setRecordedTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);
      setParseError(null);
      setParseResult(null);
      
      try {
        const result = await parseFile(file);
        setParseResult(result);
        setTransactions(result.transactions.map(t => ({
          ...t,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
        
        // Auto-switch to dashboard after successful parsing
        setTimeout(() => {
          setActiveTab('dashboard');
        }, 1000);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Failed to parse file');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Use recorded transactions or fallback to mock data
  const displayTransactions = recordedTransactions.length > 0 
    ? recordedTransactions.slice(-10).reverse() // Last 10, newest first
    : transactions.length > 0 
      ? transactions.slice(-10).reverse() // Fallback to parsed transactions
      : []

  // Calculate categories from parsed data and manually created transactions
  const getCategories = () => {
    const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500'];
    
    // Start with parsed data if available
    let categories: { [key: string]: number } = {};
    if (parseResult?.categories) {
      categories = { ...parseResult.categories };
    }
    
    // Add manually created expense transactions
    const expenseTransactions = recordedTransactions.filter(t => t.type === 'expense');
    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (categories[category]) {
        categories[category] += Math.abs(transaction.amount); // Ensure positive amount
      } else {
        categories[category] = Math.abs(transaction.amount);
      }
    });
    
    // If we have any categories, return them
    if (Object.keys(categories).length > 0) {
      const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
      
      return Object.entries(categories).map(([name, amount], index) => ({
        name,
        amount,
        color: categoryColors[index % categoryColors.length],
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
      }));
    }
    
    // Return empty array when no data is available
    return [];
  };

  // Calculate asset distribution with individual account details
  const totalAssets = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Group accounts by type with individual account details
  const assetDistribution = accounts.reduce((acc, account) => {
    const existing = acc.find(item => item.type === account.type);
    if (existing) {
      existing.amount += account.balance;
      existing.count += 1;
      existing.accounts.push({
        name: account.name,
        balance: account.balance,
        percentage: totalAssets > 0 ? (account.balance / totalAssets) * 100 : 0
      });
    } else {
      acc.push({
        type: account.type,
        amount: account.balance,
        count: 1,
        accounts: [{
          name: account.name,
          balance: account.balance,
          percentage: totalAssets > 0 ? (account.balance / totalAssets) * 100 : 0
        }]
      });
    }
    return acc;
  }, [] as Array<{ 
    type: string; 
    amount: number; 
    count: number; 
    accounts: Array<{ name: string; balance: number; percentage: number }> 
  }>);

  // Calculate percentages and sort by amount
  const assetDistributionWithPercentages = assetDistribution.map(item => ({
    ...item,
    percentage: totalAssets > 0 ? (item.amount / totalAssets) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  const updateAccountsDB = async (updater: (prev: Account[]) => Account[]) => {
    const updatedAccounts = updater(accounts);
    setAccounts(updatedAccounts);
    
    // Update each account in Supabase
    for (const account of updatedAccounts) {
      try {
        await accountService.update(account.id, account);
      } catch (error) {
        console.error('Error updating account:', error);
      }
    }
  };

  const createAccount = async (accountData: { name: string; type: string; balance: number }) => {
    try {
      const newAccount = await accountService.create(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      await accountService.delete(accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const transaction = recordedTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    try {
      // Adjust account balances
      if (transaction.type === 'income' && transaction.account) {
        await updateAccountsDB(prev => prev.map(acc => 
          acc.name === transaction.account 
            ? { ...acc, balance: acc.balance - transaction.amount }
            : acc
        ));
      } else if (transaction.type === 'expense' && transaction.account) {
        await updateAccountsDB(prev => prev.map(acc => 
          acc.name === transaction.account 
            ? { ...acc, balance: acc.balance - Math.abs(transaction.amount) }
            : acc
        ));
      } else if (transaction.type === 'transfer' && transaction.source_account && transaction.destination_account) {
        await updateAccountsDB(prev => prev.map(acc => {
          if (acc.name === transaction.source_account) {
            return { ...acc, balance: acc.balance + Math.abs(transaction.amount) };
          } else if (acc.name === transaction.destination_account) {
            return { ...acc, balance: acc.balance - Math.abs(transaction.amount) };
          }
          return acc;
        }));
      }

      // Delete transaction from Supabase
      await transactionService.delete(transactionId);
      setRecordedTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Adjust account balances
      if (transaction.type === 'income' && transaction.account) {
        await updateAccountsDB(prev => prev.map(acc => 
          acc.name === transaction.account 
            ? { ...acc, balance: acc.balance + transaction.amount }
            : acc
        ));
      } else if (transaction.type === 'expense' && transaction.account) {
        await updateAccountsDB(prev => prev.map(acc => 
          acc.name === transaction.account 
            ? { ...acc, balance: acc.balance + transaction.amount } // transaction.amount is already negative
            : acc
        ));
      } else if (transaction.type === 'transfer' && transaction.source_account && transaction.destination_account) {
        await updateAccountsDB(prev => prev.map(acc => {
          if (acc.name === transaction.source_account) {
            return { ...acc, balance: acc.balance - Math.abs(transaction.amount) };
          } else if (acc.name === transaction.destination_account) {
            return { ...acc, balance: acc.balance + Math.abs(transaction.amount) };
          }
          return acc;
        }));
      }

      // Save transaction to Supabase
      const newTransaction = await transactionService.create(transaction);
      setRecordedTransactions(prev => [...prev, newTransaction]);
      setIsRecordCreationOpen(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">FinanceFlow</h1>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Transactions
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upload Your Bank Statement
              </h2>
              <p className="text-gray-600 text-lg">
                Get instant insights into your spending patterns and discover investment opportunities
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-blue-300 transition-colors">
                <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your bank statement here
                </h3>
                <p className="text-gray-500 mb-6">
                  Support for CSV, PDF, and Excel files
                </p>
                <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.pdf,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {selectedFile && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-green-900">{selectedFile.name}</p>
                      <p className="text-sm text-green-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <div>
                      <p className="font-semibold text-blue-900">Processing file...</p>
                      <p className="text-sm text-blue-700">
                        Analyzing transactions and categorizing expenses
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parseError && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="font-semibold text-red-900">Error processing file</p>
                      <p className="text-sm text-red-700">{parseError}</p>
                    </div>
                  </div>
                </div>
              )}

              {parseResult && !isProcessing && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-green-900">File processed successfully!</p>
                      <p className="text-sm text-green-700">
                        Found {parseResult.transactions.length} transactions
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Upload</h4>
                  <p className="text-sm text-gray-600">Securely upload your statement</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Analyze</h4>
                  <p className="text-sm text-gray-600">AI categorizes transactions</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Invest</h4>
                  <p className="text-sm text-gray-600">Get personalized recommendations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Total Assets Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Assets</p>
                  <p className="text-3xl font-bold">
                    {formatINR(totalAssets)}
                  </p>
                  <p className="text-sm opacity-75 mt-1">
                    Across {accounts.length} account{accounts.length > 1 ? 's' : ''} in {assetDistributionWithPercentages.length} categories
                  </p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Asset Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {assetDistributionWithPercentages.map((asset, index) => {
                const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-red-600', 'text-yellow-600'];
                const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-red-100', 'bg-yellow-100'];
                const icons = [TrendingUp, PieChart, Target, DollarSign, ArrowUpRight, ArrowDownRight];
                const Icon = icons[index % icons.length];
                
                return (
                  <div key={asset.type} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">{asset.type}</p>
                        <p className="text-2xl font-bold">
                          <span className={colors[index % colors.length]}>
                            {asset.percentage.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatINR(asset.amount)} ({asset.count} account{asset.count > 1 ? 's' : ''})
                        </p>
                      </div>
                      <div className={`${bgColors[index % bgColors.length]} rounded-full p-3`}>
                        <Icon className={`h-6 w-6 ${colors[index % colors.length]}`} />
                      </div>
                    </div>
                    
                    {/* Individual Accounts */}
                    <div className="space-y-2">
                      {asset.accounts.map((account) => (
                        <div key={account.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">{account.percentage.toFixed(1)}% of total</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatINR(account.balance)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Asset Distribution Chart */}
            <AssetDistributionChart assetDistribution={assetDistributionWithPercentages} />

            <Accounts 
              accounts={accounts} 
              updateAccountsDB={updateAccountsDB}
              createAccount={createAccount}
              deleteAccount={deleteAccount}
            />

            {/* Spending Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending Categories</h3>
                {getCategories().length > 0 ? (
                  <div className="space-y-4">
                    {getCategories().map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${category.color}`} />
                          <span className="text-gray-700">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatINR(category.amount)}</p>
                          <p className="text-sm text-gray-500">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Spending Data</h4>
                    <p className="text-gray-500 mb-6">
                      Upload a transaction file or create transactions to see your spending categories breakdown.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </button>
                      <button
                        onClick={() => setIsRecordCreationOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Transaction
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
                {displayTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-3">
                      <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No transactions available</p>
                    <p className="text-gray-400 text-xs mt-1">Add transactions using the + button or upload a statement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 rounded-full p-2">
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatINR(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-sm text-gray-500">{transaction.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Financial Insights</h2>
              <p className="text-gray-600 text-lg">
                Personalized recommendations to optimize your finances
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3 mr-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Investment Opportunity</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  With your current savings rate of {parseResult && parseResult.totalIncome > 0 
                    ? ((parseResult.totalIncome - parseResult.totalExpenses) / parseResult.totalIncome * 100).toFixed(1)
                    : '95.2'}%, you could invest {formatINR(parseResult ? Math.round((parseResult.totalIncome - parseResult.totalExpenses) * 0.8) : 4000)} monthly in a diversified portfolio.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Potential 10-year growth</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatINR(parseResult ? Math.round((parseResult.totalIncome - parseResult.totalExpenses) * 0.8 * 12 * 10 * 1.07) : 624000)}
                  </p>
                  <p className="text-sm text-gray-500">Assuming 7% annual return</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-full p-3 mr-3">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Spending Optimization</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Your food expenses are {parseResult?.categories?.Food ? 
                    Math.round((parseResult.categories.Food / parseResult.totalExpenses) * 100) : 35}% of total spending. Consider meal planning to reduce by 20%.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Potential monthly savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatINR(parseResult?.categories?.Food ? Math.round(parseResult.categories.Food * 0.2 / 12) : 26)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Extra {formatINR(parseResult?.categories?.Food ? Math.round(parseResult.categories.Food * 0.2) : 312)} per year
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended Investment Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">60%</div>
                  <p className="font-semibold text-gray-900">Stock Market</p>
                  <p className="text-sm text-gray-600">Index funds & ETFs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">30%</div>
                  <p className="font-semibold text-gray-900">Bonds</p>
                  <p className="text-sm text-gray-600">Government & corporate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">10%</div>
                  <p className="font-semibold text-gray-900">Alternative</p>
                  <p className="text-sm text-gray-600">REITs & commodities</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">All Transactions</h2>
              <p className="text-gray-600 text-lg">
                View and manage your recorded transactions
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRecordCreationOpen(true)}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Create
                  </button>
                  <select
                    value={txFilter}
                    onChange={(e) => setTxFilter(e.target.value as 'all' | 'income' | 'expense' | 'transfer')}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="expense">Expenses</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfers</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm w-64"
                  />
                </div>
              </div>

              {recordedTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions recorded yet</h3>
                  <p className="text-gray-500 mb-4">Start by adding your first transaction using the + button</p>
                  <button
                    onClick={() => setIsRecordCreationOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Transaction
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordedTransactions
                    .filter(t => txFilter === 'all' ? true : t.type === txFilter)
                    .filter(t => {
                      if (!txSearch.trim()) return true;
                      const q = txSearch.toLowerCase();
                      return (
                        t.description.toLowerCase().includes(q) ||
                        t.category.toLowerCase().includes(q) ||
                        t.date.toLowerCase().includes(q)
                      );
                    })
                    .map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className={`rounded-full p-2 ${
                            transaction.type === 'income' ? 'bg-green-100' : 
                            transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : transaction.type === 'expense' ? (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.category} • {transaction.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 
                              transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}{formatINR(Math.abs(transaction.amount))}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Delete transaction "${transaction.description}"?`)) {
                                deleteTransaction(transaction.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete transaction"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button - only on Dashboard */}
      {activeTab === 'dashboard' && (
        <button
          onClick={() => setIsRecordCreationOpen(true)}
          className="fixed bottom-8 right-8 inline-flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors h-14 w-14"
          aria-label="Add record"
        >
          +
        </button>
      )}

      {/* Record Creation Modal */}
      <RecordCreation
        isOpen={isRecordCreationOpen}
        onClose={setIsRecordCreationOpen}
        accounts={accounts}
        onSaveTransaction={saveTransaction}
      />
    </div>
  );
}

export default App;