import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { FormEvent } from 'react';

type AccountCreationDialogArgs = {
    isEdit: boolean;
    canShowAccCreationDialog: boolean;
    currentAccount: {
        name?: string;
        type?: string;
        balance?: number;
    }
    handleSuccessAccCreation: (event: FormEvent<HTMLFormElement>) => void;
    handleDialogClose: (canShowAccCreationDialog: boolean) => void;
}

export default function AccountCreationDialog({
    isEdit,
    canShowAccCreationDialog,
    currentAccount,
    handleSuccessAccCreation,
    handleDialogClose
}: AccountCreationDialogArgs) {
    return (
        <Dialog open={canShowAccCreationDialog} onClose={handleDialogClose} className="relative z-10">
                <DialogBackdrop transition className="fixed inset-0 bg-gray-900/50 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"/>
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline outline-1 -outline-offset-1 outline-white/10 transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                        >
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                                        {isEdit ? 'Edit Account' : 'Create New Account'}
                                        </DialogTitle>
                                        <div className="mt-2">
                                            <form onSubmit={handleSuccessAccCreation}>
                                                <div className="space-y-12">
                                                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                                        <div className="sm:col-span-4">
                                                            <label htmlFor="account-name" className="block text-sm/6 font-medium text-gray-900">Account Name</label>
                                                            <div className="mt-2">
                                                                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                                                                    <input id="account-name" type="text" name="accountName" value={currentAccount.name} defaultValue="" placeholder="Cash Account" className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" required/>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-3">
                                                            <label htmlFor="account-type" className="block text-sm/6 font-medium text-gray-900">Account type</label>
                                                            <div className="mt-2 grid grid-cols-1">
                                                                <select id="account-type" name="accountType" value={currentAccount.type} defaultValue="General" autoComplete="account-type" className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                                                    <option>Savings Account</option>
                                                                    <option>Current Account</option>
                                                                    <option>Fixed Deposit</option>
                                                                    <option>Recurring Deposit</option>
                                                                    <option>Credit Card</option>
                                                                    <option>Cash</option>
                                                                    <option>Stock</option>
                                                                    <option>Mutual Fund</option>
                                                                    <option>ETF</option>
                                                                    <option>Bonds</option>
                                                                    <option>PPF</option>
                                                                    <option>EPF</option>
                                                                    <option>NPS</option>
                                                                    <option>Insurance</option>
                                                                    <option>Gold</option>
                                                                    <option>Cryptocurrency</option>
                                                                    <option>Real Estate</option>
                                                                    <option>Loan</option>
                                                                    <option>Mortgage</option>
                                                                    <option>Overdraft</option>
                                                                    <option>Other</option>
                                                                </select>
                                                                <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4">
                                                                    <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-4">
                                                            <label htmlFor="open-bal" className="block text-sm/6 font-medium text-gray-900">Opening Balance</label>
                                                            <div className="mt-2">
                                                                <div className="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                                                                    <input id="open-bal" type="text" name="openingBalance" value={currentAccount.balance} defaultValue="0" placeholder="0" className="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" required/>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                                    <button type="submit" className="inline-flex w-full justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 sm:ml-3 sm:w-auto" >
                                                        {isEdit ? 'Update Account' : 'Add Account'}
                                                    </button>
                                                    <button type="button" data-autofocus onClick={() => handleDialogClose(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
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