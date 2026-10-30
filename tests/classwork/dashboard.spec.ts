import { test, expect } from './fixtures';
import { DashboardPage } from './pages/DashboardPage';
import users from './data/users.json';

//here we will use our custom fixture 'loggedInPage'
//where the data is already reset, logged in as Ram, and redirected to Dashboard page
test.describe('Dashboard', ()=>{
    test('AT-03 Check dashboard balance, wallet Id and recent list @smoke', async ({ loggedInPage }) => {
      const dashboardPage = new DashboardPage(loggedInPage);

      //checking welcome message
      await expect(dashboardPage.welcomeMessage).toHaveText('Namaste, Ram Thapa');
      await expect(dashboardPage.balanceAmount).toHaveText('Rs. 32,450.00');
      await expect(dashboardPage.walletId).toHaveText(users.ram.mobile);
      await expect(dashboardPage.recentTransaction).toHaveCount(3);      
    });

    //hide and show the amount
    test('AT-04 hide and show balance @regression', async({loggedInPage}) =>{
      const dashboardPage = new DashboardPage(loggedInPage);
      await dashboardPage.toggleBalanceButton.click();
      await expect(dashboardPage.balanceAmount).toHaveText('Rs. XXXX.XX');
      await expect(dashboardPage.toggleBalanceButton).toHaveText('Show balance');
      //show balance again
      await dashboardPage.toggleBalanceButton.click();
      await expect(dashboardPage.balanceAmount).toHaveText('Rs. 32,450.00');
      await expect(dashboardPage.toggleBalanceButton).toHaveText('Hide balance');
    });
});