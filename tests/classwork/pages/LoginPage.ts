import {Page, Locator, expect} from '@playwright/test';

export class LoginPage{
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly loginError: Locator;

    constructor (page:Page){
        this.page = page;
        this.usernameInput = page.getByLabel('Username');
        this.passwordInput = page.getByLabel('Password');
        this.loginButton = page.getByRole('button', {name: 'Login'});
        this.loginError = page.getByTestId('login-error');
    }

    //open login page
    async goto(){
        await this.page.goto('/login');
    }
    
    //enter the credentials 
    async login(username: string, password: string){
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    //verify successful login
    async loginSuccess(){
        await expect(this.page).toHaveURL(/\/dashboard$/);
    }

    //verify login error message
    async loginErrorMessage(message: string){
        await expect(this.loginError).toHaveText(message);
    }
}