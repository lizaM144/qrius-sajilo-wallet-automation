import {test, expect} from './fixtures'
import { PaymentPage } from './pages/PaymentPage';
import { DashboardPage } from './pages/DashboardPage';
import users from './data/users.json';

test.describe('Payment', () =>{
    test('AT-05 Send Rs. 500 to Sita', async ({loggedInPage}) =>{
        const paymentPage = new PaymentPage(loggedInPage);
        await paymentPage.goto();
        await expect(loggedInPage).toHaveURL(/\/payment$/);

        //send money to sita
        await paymentPage.fillPaymentDetail(
            users.sita.mobile, '500', 'Bill Sharing', 'Sent Rs. 500 to sita'
        )
        
        await paymentPage.continuePayment();

        //confirm info in the confirmation form
        await paymentPage.confirmReceiverInfo(
            'Sita Sharma', users.sita.mobile, '500', 'Bill Sharing', 'Sent Rs. 500 to sita'
        )

        //pin
        await paymentPage.confirmPayment(users.ram.pin);
        
        await expect(paymentPage.successMessage).toBeVisible();
        await expect(paymentPage.transactionId).toBeVisible();
        await expect(paymentPage.transactionId).not.toBeEmpty();

        //check if the new balance deducted or not
        const dashboardPage = new DashboardPage(loggedInPage);
        await dashboardPage.goto();
        await expect(paymentPage.newBalance).toHaveText('Rs. 31,950.00');
    })
})