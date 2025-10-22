export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export interface FileParseResult {
  transactions: ParsedTransaction[];
  totalIncome: number;
  totalExpenses: number;
  categories: { [key: string]: number };
}

// Common keywords that indicate income/deposits
const INCOME_KEYWORDS = [
  'deposit', 'salary', 'wage', 'payment', 'refund', 'credit', 'transfer in',
  'direct deposit', 'payroll', 'bonus', 'commission', 'dividend', 'interest',
  'reimbursement', 'cashback', 'reward', 'gift', 'inheritance', 'settlement'
];

// Common keywords that indicate expenses
const EXPENSE_KEYWORDS = [
  'purchase', 'payment', 'withdrawal', 'debit', 'transfer out', 'fee',
  'subscription', 'bill', 'charge', 'transaction', 'atm', 'cash withdrawal',
  'online purchase', 'pos', 'point of sale', 'merchant', 'store', 'shop',
  'gas', 'fuel', 'restaurant', 'food', 'grocery', 'entertainment', 'travel'
];

// Common expense categories
const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  'Food': ['restaurant', 'food', 'grocery', 'coffee', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'mcdonalds', 'starbucks'],
  'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'bus', 'train', 'subway', 'metro'],
  'Entertainment': ['netflix', 'spotify', 'amazon prime', 'hulu', 'disney', 'movie', 'theater', 'concert', 'game', 'gaming'],
  'Shopping': ['amazon', 'walmart', 'target', 'costco', 'best buy', 'clothing', 'shoes', 'electronics'],
  'Utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'cable', 'utility', 'bill'],
  'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'dental', 'vision', 'insurance'],
  'Housing': ['rent', 'mortgage', 'home', 'apartment', 'property', 'maintenance'],
  'Income': ['salary', 'wage', 'deposit', 'payment', 'refund', 'bonus', 'commission']
};

export function determineTransactionType(description: string, amount: number): 'income' | 'expense' {
  const lowerDescription = description.toLowerCase();
  
  // Check for income keywords
  for (const keyword of INCOME_KEYWORDS) {
    if (lowerDescription.includes(keyword)) {
      return 'income';
    }
  }
  
  // Check for expense keywords
  for (const keyword of EXPENSE_KEYWORDS) {
    if (lowerDescription.includes(keyword)) {
      return 'expense';
    }
  }
  
  // Fallback: positive amounts are income, negative are expenses
  return amount >= 0 ? 'income' : 'expense';
}

export function categorizeTransaction(description: string): string {
  const lowerDescription = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Others';
}

export function parseCSVFile(file: File): Promise<FileParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n');
        
        if (lines.length < 2) {
          reject(new Error('CSV file must have at least a header and one data row'));
          return;
        }
        
        // Parse header to find column indices
        const header = lines[0].split(',').map(col => col.trim().toLowerCase());
        const dateIndex = header.findIndex(col => col.includes('date'));
        const descriptionIndex = header.findIndex(col => 
          col.includes('description') || col.includes('memo') || col.includes('note') || col.includes('payee')
        );
        const amountIndex = header.findIndex(col => 
          col.includes('amount') || col.includes('debit') || col.includes('credit') || col.includes('balance')
        );
        
        if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
          reject(new Error('CSV must contain date, description, and amount columns'));
          return;
        }
        
        const transactions: ParsedTransaction[] = [];
        const categories: { [key: string]: number } = {};
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length < Math.max(dateIndex, descriptionIndex, amountIndex) + 1) {
            continue; // Skip malformed rows
          }
          
          const date = columns[dateIndex];
          const description = columns[descriptionIndex];
          const amountStr = columns[amountIndex].replace(/[$,]/g, '');
          
          // Try to parse amount
          let amount = 0;
          try {
            amount = parseFloat(amountStr);
            if (isNaN(amount)) continue;
          } catch {
            continue; // Skip rows with invalid amounts
          }
          
          const type = determineTransactionType(description, amount);
          const category = categorizeTransaction(description);
          
          // Normalize amount (expenses should be negative)
          const normalizedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
          
          const transaction: ParsedTransaction = {
            id: `transaction-${i}`,
            date,
            description,
            amount: normalizedAmount,
            category,
            type
          };
          
          transactions.push(transaction);
          
          // Update category totals
          categories[category] = (categories[category] || 0) + Math.abs(normalizedAmount);
        }
        
        // Calculate totals
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0));
        
        resolve({
          transactions,
          totalIncome,
          totalExpenses,
          categories
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function parseExcelFile(file: File): Promise<FileParseResult> {
  // For now, we'll use a simple approach that converts Excel to CSV
  // In a production app, you'd want to use a proper Excel parsing library
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // This is a simplified approach - in reality you'd need a proper Excel parser
        // For now, we'll treat it as a text file and try to parse it
        const content = event.target?.result as string;
        
        // Try to extract CSV-like content from Excel
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('Excel file must have at least a header and one data row'));
          return;
        }
        
        // Simple parsing - this would need to be enhanced for real Excel files
        const transactions: ParsedTransaction[] = [];
        const categories: { [key: string]: number } = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Simple tab or comma separation
          const columns = line.split(/[\t,]/).map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length < 3) continue;
          
          const [date, description, amountStr] = columns;
          
          let amount = 0;
          try {
            amount = parseFloat(amountStr.replace(/[$,]/g, ''));
            if (isNaN(amount)) continue;
          } catch {
            continue;
          }
          
          const type = determineTransactionType(description, amount);
          const category = categorizeTransaction(description);
          
          const normalizedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
          
          const transaction: ParsedTransaction = {
            id: `transaction-${i}`,
            date,
            description,
            amount: normalizedAmount,
            category,
            type
          };
          
          transactions.push(transaction);
          categories[category] = (categories[category] || 0) + Math.abs(normalizedAmount);
        }
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0));
        
        resolve({
          transactions,
          totalIncome,
          totalExpenses,
          categories
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function parseFile(file: File): Promise<FileParseResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
} 