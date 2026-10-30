import {Page, Locator} from '@playwright/test';

export class DashboardPage{
    readonly page: Page;
    readonly welcomeMessage: Locator;
    readonly balanceAmount: Locator;
    readonly walletId: Locator;
    readonly toggleBalanceButton: Locator;
    readonly recentTransaction: Locator;

    constructor(page: Page){
        this.page = page;
        this.welcomeMessage = page.getByTestId('welcome-message');
        this.balanceAmount = page.getByTestId('balance-amount');
        this.walletId = page.getByTestId('wallet-id');
        this.toggleBalanceButton = page.getByTestId('toggle-balance');
        this.recentTransaction = page.getByTestId('recent-txn');
    }

    async goto(){
        await this.page.goto('/dashboard');
    }
}