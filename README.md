# stripe-app-terminal
A Stripe App that allows a Stripe dashboard user to accept payment methods using Stripe Terminal. 

## Prerequisites

Learn about Stripe Apps [here](https://stripe.com/docs/stripe-apps).

Learn about Stripe Terminal [here](https://stripe.com/docs/terminal).

## How It Works

The app works with one viewport: stripe.dashboard.customer.detail.

When viewing a customer, a user can open this app to add a payment method to the customer's account or capture a payment on the customer's account. 

## Hardware Requirements

If you want to do more than testing, you'll need to purchase a Stripe Terminal Reader Wise POS3 (This app requires Server Mode integration). Read more about this reader [here](https://stripe.com/docs/terminal/readers/bbpos-wisepos-e).

## Backend

This app requires a backend in order to communicate with the Stripe Terminal API. An example backend Python API is included in the backend folder.

## Setup Instructions

1. Clone this repository.

```git clone https://github.com/ericlackey/stripe-app-terminal```

2. Install frontend and backend dependencies.

```
cd stripe-app-terminal/frontend
yarn install
cd ../backend
pip3 install -r requirements.txt
```

3. Open the file frontend/stripe-app.json. Change the app id from "com.example.terminal" to something else such as "com.yourcompanyname.terminal". Stripe only allows one instance of an app id across all Stripe Accounts. 

4. Run the Stripe Apps upload command. Follow the instructions and launch the Stripe dashboard.

```stripe apps upload```

5. When viewing the app in the Stripe Dashboard, click on the Gear icon and then click on Signing Secret. Copy the Signing Secret.

6. Create a .env file in the backend/ folder with the structure below. Enter your Stripe API key and the signing key you retrieved in the step above. Save the file.

```
STRIPE_API_KEY=<your stripe standard API key>
STRIPE_APP_SIGNING_KEY=<your stripe app signing key>
```

7. Add the backend API URL to the stripe-app.json configuration file in the content_security_policy section. 

If you are using the example backend server, you can simply use the configuration below. You cannot do this step until now because Stripe will not allow you to upload an app policy that points at localhost. So, this should just be used for development/testing purposes.

```
    "content_security_policy": {
      "connect-src": [
        "https://localhost:5001/"
      ],
      "image-src": null,
      "purpose": "Connect to Terminal"
    }
```

