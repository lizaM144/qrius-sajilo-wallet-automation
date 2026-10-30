import {test, expect} from '@playwright/test';
import users from './data/users.json';
import negatives from './data/login-negative.json';
import { LoginPage } from './pages/LoginPage';

test.describe('Login', ()=> {
    let loginPage: LoginPage;
    test.beforeEach(async ({page}) =>{
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('AT-01 valid login opens the dashboard @smoke', async({page}) => {
        // const loginPage = new LoginPage(page);
        // await loginPage.goto();
        await loginPage.login(users.ram.username, users.ram.password);
        await loginPage.loginSuccess();
    });

    // now for all the negative logins
    for (const data of negatives){
        test(`AT-02 ${data.id} login fails: ${data.title} @regression`, async({page}) =>{
            await loginPage.login(data.username, data.password);
            //error message
            await expect(page.getByTestId(data.field)).toHaveText(data.message);
            //field is the locator
            //message is the literal message shown after negative login

            //user should still remain on the login page
            await expect(page).toHaveURL(/\/login$/);
        });
    }
});