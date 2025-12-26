import { supabase, Account, Transaction } from './supabase'

// Helper to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}

// Account operations
export const accountService = {
  async getAll(): Promise<Account[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...account, user_id: userId }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Transaction operations
export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: userId }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
