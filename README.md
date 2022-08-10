# stripe-app-terminal
A Stripe App that allows a dashboard user to accept a payment for a Stripe Invoice using Stripe Terminal.



## How It Works

When a user is viewing an open Stripe Invoice, they can open this app to take payment from the customer using Stripe Terminal. The app sends a setupIntent  to Stripe Terminal reader. Once the customer inserts a valid card into the reader, a new payment method is created on the customer and the app will attempt to pay the invoice using the new payment method.

## Requirements
- Setup Backend service to communicate with the Stripe Terminal service
- Purchase a Stripe Terminal Reader Wise POS3 (Server 

## Backend

This app requires a backend in order to communicate with the Stripe Terminal service.

The backend service must be able to respond to the following requests:

- /readers - Return list of Stripe Terminal Readers
- /charge - Begin the process of capturing funds
- /display - Display something on the reader
- /cancel - Cancel the active reader action


