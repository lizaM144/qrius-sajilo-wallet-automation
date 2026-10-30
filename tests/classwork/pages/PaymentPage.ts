import {Page, Locator, expect} from '@playwright/test';

export class PaymentPage{
    readonly page: Page;
    readonly availableBalance: Locator;
    readonly receiverInput: Locator;
    readonly amountInput: Locator;
    readonly purposeSelect: Locator;
    readonly receiverError: Locator;
    readonly purposeError: Locator;
    readonly amountError: Locator;
    readonly remarksInput: Locator;
    readonly continueButton: Locator;

    //confirmation form
    readonly pinInput: Locator;
    readonly pinError: Locator;
    readonly backButton: Locator;
    readonly confirmButton: Locator;
    readonly paymentError: Locator;

    //success screen
    readonly transactionId: Locator;
    readonly doneButton: Locator;
    readonly newBalance: Locator;
    readonly successMessage: Locator;

    //confirm receiver info
    readonly confirmReceiverName: Locator;
    readonly confirmReceiverMobile: Locator;
    readonly confirmAmount: Locator;
    readonly confirmPurpose: Locator;
    readonly confirmRemarks: Locator;

    constructor(page: Page){
        this.page = page;
        this.availableBalance = page.getByTestId('payment-balance');
        this.receiverInput = page.getByLabel('Receiver mobile number');
        this.amountInput = page.getByLabel('Amount (Rs.)');
        this.purposeSelect = page.getByLabel('Purpose');
        this.receiverError = page.getByTestId('receiver-error');
        this.purposeError = page.getByTestId('purpose-error');
        this.amountError = page.getByTestId('amount-error');
        this.remarksInput = page.getByTestId('remarks-input');
        this.continueButton = page.getByRole('button',{name: 'Continue'});

        this.pinInput = page.getByLabel('Transaction PIN');
        this.pinError = page.getByTestId('pin-error');
        this.backButton = page.getByRole('button', { name: 'Back' });
        this.confirmButton = page.getByRole('button', {name: 'Confirm Payment'});
        this.paymentError = page.getByTestId('payment-error');

        this.transactionId = page.getByTestId('success-txn-id');
        this.doneButton = page.getByRole('button', {name: 'Done'});
        this.newBalance = page.getByTestId('balance-amount');
        this.successMessage = page.getByTestId('success-message');

        this.confirmReceiverName = page.getByTestId('confirm-receiver-name');
        this.confirmReceiverMobile = page.getByTestId('confirm-receiver');
        this.confirmAmount = page.getByTestId('confirm-amount');
        this.confirmPurpose = page.getByTestId('confirm-purpose');
        this.confirmRemarks = page.getByTestId('confirm-remarks');
    }

    async goto(){
        await this.page.goto('/payment');
    }

    async fillPaymentDetail(
        receiver: string,
        amount: string,
        purpose: string,
        remarks: string
    ){
        await this.receiverInput.fill(receiver);
        await this.amountInput.fill(amount);
        await this.purposeSelect.selectOption({label: purpose});
        await this.remarksInput.fill(remarks);
    }

    async continuePayment(){
        await this.continueButton.click();
    }

    //confirm receiver info
    async confirmReceiverInfo(
        receiverName: string,
        receiverMobile: string,
        amount: string,
        purpose: string,
        remarks: string
    ){
        await expect(this.confirmReceiverName).toHaveText(receiverName);
        await expect(this.confirmReceiverMobile).toContainText(receiverMobile);
        await expect(this.confirmAmount).toContainText(amount);
        await expect(this.confirmPurpose).toContainText(purpose);
        await expect(this.confirmRemarks).toContainText(remarks);
    }

    //entering pin
    async confirmPayment(pin:string){
        await this.pinInput.fill(pin);
        await this.confirmButton.click();
    }

    
}