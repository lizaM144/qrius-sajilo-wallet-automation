import {test, expect} from './fixtures';
import { HistoryPage } from './pages/HistoryPage';
import searchItems from './data/transaction-search.json'

test.describe('Transaction History',()=>{
    test('AT-08 display transactions', async ({loggedInPage}) => {
        const historyPage = new HistoryPage(loggedInPage);
        await historyPage.goto();
        await expect(loggedInPage).toHaveURL(/\/transactions$/)
        await expect(historyPage.transactionRows).toHaveCount(6);
    });

    for(const data of searchItems){
        test(`AT-08 ${data.id}: ${data.title} @regression`, async ({loggedInPage}) =>{
            const historyPage = new HistoryPage(loggedInPage);
            await historyPage.goto();
            
            //enter the search item
            await historyPage.searchTransaction(data.searchTerm);
            //verify if matching no. of transaction 
            await expect(historyPage.transactionRows).toHaveCount(data.expectedCount);

            //also check the description
            if(data.expectedDescription !== null){
                await expect(historyPage.transactionRows.filter({hasText: data.expectedDescription})).toHaveCount(1);
            }

            //if no matching transaction is shown verify nothing is shown
            if(data.expectedCount == 0){
                await expect(historyPage.emptyState).toBeVisible();
            }
        })
    }

    test('AT-08 filter transactions by type', async ({loggedInPage})=>{
        const historyPage = new HistoryPage(loggedInPage);
        await historyPage.goto();
        await historyPage.filterType('Credit');
        //the displayed rows should match the selected type
        await expect(historyPage.transactionRows).toHaveCount(2);
        await expect(historyPage.transactionRows.filter({hasText: "Credit"})).toHaveCount(2);
    })
});