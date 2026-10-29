import { test as base, expect, Page } from '@playwright/test';
import users from './data/users.json';

type MyFixtures = { loggedInPage: Page }; // custom fixtures

export const test = base.extend<MyFixtures>({
  loggedInPage: async ({ page, request }, use) => {
    // TODO 1: put the app data back to its starting state
    //         (POST /api/test/reset with the request fixture)
    await request.post('/api/test/reset'); //send HTTP requests with request to the backend

    // TODO 2: open /login and log in as users.ram
    await page.goto('/login');
    await page.getByLabel('Username').fill(users.ram.username);
    await page.getByLabel('Password').fill(users.ram.password);
    await page.getByRole('button', {name: 'Login'}).click();

    // TODO 3: assert that the URL ends with /dashboard
    await expect(page).toHaveURL(/\/dashboard$/);

    await use(page);   // the test runs here
  },
});

export { expect };