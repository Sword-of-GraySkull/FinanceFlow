import { PlusCircle, Trash2 } from 'lucide-react';
import { useState, FormEvent } from 'react'
import AccountCreationDialog from './accounts-creation-modal';
import { Account } from '../lib/supabase';

interface AccountsProps {
    accounts: Account[];
    updateAccountsDB: (updater: (prev: Account[]) => Account[]) => Promise<void>;
    createAccount: (accountData: { name: string; type: string; balance: number }) => Promise<Account>;
    deleteAccount: (accountId: string) => Promise<void>;
}

export default function Accounts({ accounts, createAccount, deleteAccount }: AccountsProps) {
    async function handleOnAccCreation(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setOpenAccCreationModal(false);
        const formData = new FormData(event.currentTarget);
        
        try {
            await createAccount({
                name: formData.get('accountName') as string,
                type: formData.get('accountType') as string,
                balance: Number(formData.get('openingBalance')) || 0
            });
        } catch (error) {
            console.error('Error creating account:', error);
        }
    }
    const [openAccCreationModal, setOpenAccCreationModal] = useState(false)
    const [isEditDialogOpen, setEditDialogOpenState] = useState(false);
    const [currentAccount, setCurrentAccount] = useState({})
;    return (
        <>
            <div className="grid grid-cols-1">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Accounts</h3>
                    <div className="grid grid-cols-5 gap-4">
                    {accounts.map((account) => (
                        <div key={account.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative" onClick={() => {setCurrentAccount(account);setEditDialogOpenState(true);setOpenAccCreationModal(true);}}>
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                                title="Delete account"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete account '${account.name}'?`)) {
                                        try {
                                            await deleteAccount(account.id);
                                        } catch (error) {
                                            console.error('Error deleting account:', error);
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2 pr-8">{account.name}</h4>
                            <p className="text-sm text-gray-500">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 2
                                }).format(account.balance)}
                            </p>
                        </div>
                    ))}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 align-middle">
                        <div style={{margin: '15px 0'}} onClick={() => {setEditDialogOpenState(false);setOpenAccCreationModal(true);setCurrentAccount({})}}>
                            <span>ADD ACCOUNT</span>
                            <PlusCircle className="float-right" />
                        </div>                        
                    </div>
                    </div>
                </div>    
            </div>
            <AccountCreationDialog
                isEdit={isEditDialogOpen}
                currentAccount={currentAccount}
                canShowAccCreationDialog={openAccCreationModal}
                handleSuccessAccCreation={handleOnAccCreation}
                handleDialogClose={setOpenAccCreationModal}
            />
        </>
    );
}
