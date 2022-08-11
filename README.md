# stripe-app-terminal
A Stripe App that allows a Stripe dashboard user to accept payment methods using Stripe Terminal. 

## How It Works

The app works within two different viewports: customer.detail and invoice.detail.

### customer.detail
When viewing a customer, a user can open this app to add a payment method to the customer's account. 

### invoice.detail
When a user is viewing an open Stripe Invoice, they can open this app to take payment from the customer using Stripe Terminal. The app sends a Setup Intent  to Stripe Terminal reader and then waits for the Setup Intent to complete. Once the Setup Intent is completed successfully, the attempt to pay the invoice using the new payment method.

## Requirements
- Setup Backend service to communicate with the Stripe Terminal service
- Purchase a Stripe Terminal Reader Wise POS3 (Requires Server Mode integration)

## Backend

This app requires a backend in order to communicate with the Stripe Terminal service.

The backend service must be able to respond to the following requests:

- /readers - Return a list of Stripe Terminal Readers
- /charge - Begin the process of capturing funds
- /cancel - Cancel the active reader action


