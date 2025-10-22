# Finance Flow

A beautiful and modern personal finance tracking application that analyzes your bank statements to provide insights into your spending patterns and investment opportunities.

## Features

- **File Upload**: Upload CSV and Excel bank statements
- **Smart Parsing**: Automatically categorizes transactions as income or expenses
- **Transaction Analysis**: Identifies spending patterns and categories
- **Financial Insights**: Provides personalized investment recommendations
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

## File Format Support

### CSV Files
The application supports CSV files with the following column headers:
- `Date` - Transaction date
- `Description` - Transaction description/memo/payee
- `Amount` - Transaction amount (positive for income, negative for expenses)

Example CSV format:
```csv
Date,Description,Amount
2024-01-15,Salary Deposit,5000.00
2024-01-14,Grocery Store,-120.50
2024-01-13,Gas Station,-45.00
```

### Excel Files
Basic support for Excel files (.xlsx, .xls) with similar column structure.

## Transaction Categorization

The application automatically categorizes transactions based on keywords in the description:

### Income Categories
- Salary, wages, deposits, payments, refunds, bonuses, commissions, dividends, interest

### Expense Categories
- **Food**: Restaurants, groceries, coffee shops, fast food
- **Transportation**: Gas, fuel, rideshare, parking, public transit
- **Entertainment**: Streaming services, movies, concerts, gaming
- **Shopping**: Online retailers, department stores, clothing
- **Utilities**: Electricity, water, internet, phone bills
- **Healthcare**: Medical expenses, pharmacy, insurance
- **Housing**: Rent, mortgage, property maintenance
- **Others**: Uncategorized expenses

## How It Works

1. **Upload**: Drag and drop or select your bank statement file
2. **Processing**: The app analyzes each transaction and categorizes it
3. **Analysis**: Generates spending insights and financial recommendations
4. **Dashboard**: View your financial overview with real-time calculations

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the local development URL
5. Upload a CSV file with your transaction data

## Sample Data

A sample CSV file (`sample_transactions.csv`) is included for testing the application.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Parsing Logic

The application uses intelligent keyword matching to determine transaction types:

1. **Income Detection**: Looks for keywords like "deposit", "salary", "payment", "refund"
2. **Expense Detection**: Identifies keywords like "purchase", "payment", "withdrawal", "fee"
3. **Category Assignment**: Maps transaction descriptions to predefined categories
4. **Amount Normalization**: Ensures expenses are negative and income is positive

## Future Enhancements

- PDF statement parsing
- Bank API integration
- Advanced categorization with machine learning
- Budget tracking and alerts
- Export functionality
- Multi-currency support 