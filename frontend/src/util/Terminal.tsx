import fetchStripeSignature from '@stripe/ui-extension-sdk/signature';
import type { ExtensionContextValue } from "@stripe/ui-extension-sdk/context";

import Stripe from 'stripe';

import configData from "../../api.config.json";

const backendStripeTerminalApi = configData.STRIPE_TERMINAL_BACKEND_API;

const getHeaders = async () => {
    return {
        'content-type': 'application/json',
        'stripe-signature': await fetchStripeSignature()
    }
};

const callTerminalApi = async ({userContext}: ExtensionContextValue, endpoint: string, payload: object) => {
    const response = await fetch(`${backendStripeTerminalApi}/${endpoint}`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
            user_id: userContext.id,
            account_id: userContext.account.id,
            payload: payload
        })
    }).catch(error => {
        console.error(`An error occurred calling the ${endpoint} API: ${error}`);
        throw new Error (`An error occurred calling the ${endpoint} API: ${error}`);
    });
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

export const setDisplay = async (reader: string, readerDisplayParams: Stripe.Terminal.ReaderSetReaderDisplayParams, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'set_display',{
        reader: reader,
        reader_display_params: readerDisplayParams
    });
};

export const listReaders = async (readerListParams: Stripe.Terminal.ReaderListParams, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'list_readers',{
        reader_list_params: readerListParams
    });
};

export const cancelAction = async (reader: string, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'cancel_action',{
        reader: reader
    });
};

export const processSetupIntent = async (reader: string, processSetupIntentParams: Stripe.Terminal.ReaderProcessSetupIntentParams, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'process_setup_intent',{
        reader: reader,
        process_setup_intent_params: processSetupIntentParams
    });
};

export const processPaymentIntent = async (reader: string, processPaymentIntentParams: Stripe.Terminal.ReaderProcessPaymentIntentParams, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'process_payment_intent',{
        reader: reader,
        process_payment_intent_params: processPaymentIntentParams
    });
};

export const simulatePresentPaymentMethod = async (reader: string, context: ExtensionContextValue) => {
    return await callTerminalApi(context, 'simulate_present_payment_method',{
        reader: reader
    });
};