import {Page, Locator} from '@playwright/test';

export class HistoryPage{
    readonly page: Page;
    readonly transactionRows: Locator;
    readonly typeFiler: Locator;
    readonly searchInput: Locator;
    readonly transactionCount: Locator;
    readonly emptyState: Locator; //idk

    constructor(page: Page){
        this.page = page;
        this.transactionRows = page.getByTestId('txn-row');
        this.typeFiler = page.getByLabel('Type');
        this.searchInput = page.getByLabel('Search');
        this.transactionCount = page.getByTestId('txn-count');
        this.emptyState = page.getByTestId('empty-state');
    }

    async goto(){
        await this.page.goto('/transactions');
    }

    //count the displayed transaction row
    async getTransactionCount(){
        return await this.transactionRows.count();
    }

    //select the transaction type
    async filterType(type: string){
        await this.typeFiler.selectOption({label: type});
    }

    //search input
    async searchTransaction(searchTerm: string){
        await this.searchInput.fill(searchTerm);
    }
}