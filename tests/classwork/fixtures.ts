import { test as base, expect, Page } from '@playwright/test';
import users from './data/users.json';
import { LoginPage } from './pages/LoginPage';

type MyFixtures = { loggedInPage: Page }; // custom fixtures

export const test = base.extend<MyFixtures>({
  loggedInPage: async ({ page, request }, use) => {
    // TODO 1: put the app data back to its starting state
    //         (POST /api/test/reset with the request fixture)
    await request.post('/api/test/reset'); //send HTTP requests with request to the backend
    // expect(resetResponse.ok(),'The test reset endpoint should return a successful response').toBeTruthy();
    // TODO 2: open /login and log in as users.ram
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.ram.username, users.ram.password);
    
    // TODO 3: assert that the URL ends with /dashboard
    await loginPage.loginSuccess();

    await use(page);   // the test runs here, already logged in
  },
});

export { expect };