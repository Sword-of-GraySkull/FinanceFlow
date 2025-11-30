# Supabase Integration Setup

## Database Setup

1. **Run the SQL Schema**: Copy the contents of `supabase-schema.sql` and run it in your Supabase SQL editor to create the necessary tables.

2. **Environment Variables**: Make sure your `.env` file contains:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## What's Been Integrated

✅ **Supabase Client**: Configured with your environment variables
✅ **Database Schema**: Created `accounts` and `transactions` tables
✅ **Account Management**: All account operations now use Supabase
✅ **Transaction Management**: All transaction operations now use Supabase
✅ **Real-time Sync**: Data persists across browser sessions
✅ **Type Safety**: Full TypeScript support with proper interfaces

## Database Tables

### Accounts Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `name` (Text)
- `type` (Text)
- `balance` (Decimal)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Transactions Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `date` (Date)
- `description` (Text)
- `amount` (Decimal)
- `category` (Text)
- `type` (Text: 'income', 'expense', 'transfer')
- `account` (Text, nullable)
- `source_account` (Text, nullable)
- `destination_account` (Text, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Features

- **Persistent Storage**: All data is now stored in Supabase
- **Account Management**: Create, update, delete accounts
- **Transaction Recording**: Record expenses, income, and transfers
- **Balance Updates**: Account balances automatically update with transactions
- **Data Integrity**: Proper foreign key relationships and constraints
