import {
  Box,
  Banner,
  Spinner,
  Select,
  TextField,
  Button,
  FocusView,
  ContextView
} from "@stripe/ui-extension-sdk/ui";
import type { ExtensionContextValue } from "@stripe/ui-extension-sdk/context";
import { useEffect, useState } from "react";
import Stripe from 'stripe';
import {
  createHttpClient,
  STRIPE_API_KEY,
} from '@stripe/ui-extension-sdk/http_client';
import * as terminal from "../util/Terminal";
import BrandIcon from "./brand_icon.svg";

const stripeClient = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient(),
  apiVersion: '2020-08-27',
});

/**
 * This is a view that is rendered in the Stripe dashboard's invoice detail page.
 * In stripe-app.json, this view is configured with stripe.dashboard.invoice.detail viewport.
 */
const Customer = (props: ExtensionContextValue) => {

  const [state, setState] = useState<string>('loading');
  const [readers, setReaders] = useState<Stripe.Terminal.Reader[]>([]);
  const [selectedReader, setSelectedReader] = useState<Stripe.Terminal.Reader>();
  const [error, setError] = useState<string>('');
  const [intentId, setIntent] = useState<string>('');
  const [monitorId, setMonitorId] = useState<number>();
  const [timeoutId, setTimeoutId] = useState<number>();
  const [paymentAmount, setAmount] = useState<number>(100);
  const [what,setWhat] = useState('is going on');

  // Take action on certain state changes
  useEffect(() => {
    switch (state) {
      case 'loading': {
        load();
      }
    }
  }, [state]);

  // Monitor active payment/setup intent
  useEffect(() => {

    if (!intentId) return;

    // Start a 5 second interval timer to check intent status
    const mid = setInterval(() => {
      const response = getIntentStatus();
      response.then((intent) => {
        setError(getLastIntentError(intent));
        switch (intent.status) {
          case 'succeeded':
            clearInterval(mid);
            clearTimeout(tid);
            setMonitorId(undefined);
            setTimeoutId(undefined);
            setIntent('');
            setState(intent.object == 'payment_intent' ? 'payment-collected': 'payment-method-collected');
            break;
          case 'canceled':
            clearInterval(mid);
            clearTimeout(tid);
            setMonitorId(undefined);
            setTimeoutId(undefined);
            reset();
            break;
          case 'requires_capture':
            clearTimeout(tid);
            setMonitorId(undefined);
            setTimeoutId(undefined);
            capturePaymentIntent();
            break;
        }
      });
    }, 5000);
    setMonitorId(mid);

    // Start a 90 second timeout
    const tid = setTimeout(() => {
      clearInterval(mid);
      clearTimeout(tid);
      setMonitorId(undefined);
      setTimeoutId(undefined);
      reset();
    },90000);
    setTimeoutId(tid);

  },[intentId]);

  // Stop active timers
  const stopTimers = () => {
    clearInterval(monitorId);
    clearTimeout(timeoutId);
    setMonitorId(undefined);
    setTimeoutId(undefined);
  }

  // Reset form back to default state
  const reset = async () => {
    setState('canceling');
    setIntent('');
    stopTimers();
    cancelReaderAction();
    cancelIntent();
    setState('loading');
  }

  const capturePaymentIntent = async () => {
    await stripeClient.paymentIntents.capture(intentId);
  }

  // Get the latest payment/setup intent information
  const getIntentStatus = async () => {
    let intentStatus;
    if (intentId.startsWith('seti')) {
      intentStatus = await stripeClient.setupIntents.retrieve(intentId);
    } else if (intentId.startsWith('pi')) {
      intentStatus = await stripeClient.paymentIntents.retrieve(intentId);
    }
    return intentStatus;
  }

  // Get the latest error message on payment/setup intent
  const getLastIntentError = (intent) => {
    let lastIntentError = '';
    if (intent.object == 'setup_intent' && intent.last_setup_error) {
      lastIntentError = intent.last_setup_error.message;
    } else if (intent.object == 'payment_intent' && intent.last_payment_error) {
      lastIntentError = intent.last_payment_error.message;
    }
    return lastIntentError;
  }

  // Cancel the current payment/setup intent
  const cancelIntent = async () => {
    if (intentId.startsWith('seti')) {
      stripeClient.setupIntents.cancel(intentId);
    } else if (intentId.startsWith('pi')) {
      stripeClient.paymentIntents.cancel(intentId);
    }
  }

  // Start a setup intent and send to reader
  const processSetupIntent = async () =>  {
    const setupIntent = await stripeClient.setupIntents.create({
      customer: props.environment.objectContext?.id,
      payment_method_types: ['card_present'],
      usage: 'off_session'
    }).catch((err) => {
      setError(`Unable to start a setup intent.`);
      console.error(`Unable to start a setup intent due to error: ${err}`);
      setState('error');
      return;
    });
    if (!setupIntent) {
      return;
    }
    await terminal.processSetupIntent(selectedReader.id, {
        customer_consent_collected: true,
        setup_intent: setupIntent.id,
      }, props)
    .then(() => {
      setIntent(setupIntent.id);
      setState('charging');
    })
    .catch((err) => {
      setError(`Unable to send setup intent to reader.`);
      console.error(`Unable to send setup intent to reader due to error: ${err}`);
      setState('error');
    });
  };

  // Start a payment intent and send to reader
  const processPaymentIntent = async () =>  {
    const paymentIntent = await stripeClient.paymentIntents.create({
      customer: props.environment.objectContext?.id,
      capture_method: 'automatic',
      payment_method_types: ['card_present'],
      amount: paymentAmount,
      currency: 'usd'
    }).catch((err) => {
      setState('error');
      setError(`Unable to start a payment intent: ${err}`);
    });
    if (!paymentIntent) {
      return;
    }
    await terminal.processPaymentIntent(selectedReader.id, {
        payment_intent: paymentIntent.id
      }, props)
    .then(() => {
      setIntent(paymentIntent.id);
      setState('charging');
    })
    .catch((err) => {
      setError(`Unable to send payment intent to reader.`);
      console.error(`Unable to send payment intent to reader due to error: ${err}`);
      setState('error');
    });
  };

  // Simulate a successful payment on a simulated reader
  const simulatePresentPaymentMethod = async () => {
    if (selectedReader) {
      await terminal.simulatePresentPaymentMethod(selectedReader.id, props);
    }
  }

  // Cancel the active reader action
  const cancelReaderAction = async () =>  {
    if (selectedReader) {
      await terminal.cancelAction(selectedReader.id, props);
    }
  }
  
  // Load the online readers for this account
  const load = () => {
    setError('');
    setState('loading-readers');
    
    terminal.listReaders({
        limit: 5,
        status: 'online'
      },props)
    .then(terminalReaders => {
      if (!terminalReaders || terminalReaders.length==0) {
        setError('No online readers were found.');
        setState('error');
        return;
      }
      setReaders(terminalReaders);
      setSelectedReader(terminalReaders[0]);
      setState('ready');
    })    
    .catch(err => {
      setError('Could not load readers due to API error. Check the console logs for more detail.');
      setState('error');
    })

  
  };

  const actions = (state) => {
    let simulatePaymentButton;
    let errorMessage;
    switch (state) {
      case 'error':
        return (
          <Box css={{
            stack: 'y',
            gap: 'medium',
            wordWrap: 'break-word'
          }}>
            <Banner type="critical" description={
              <Box css={{wordWrap: 'break-word'}}>{error}</Box>
            }/>
            <Button type="primary"
              onPress={reset}
              css={{width:'fill'}}>Try Again</Button>
          </Box>
        );
      case 'loading-readers':
        return (
          <Box css={{textAlign:"center"}}>
          <Banner type="default" description={
            <Box>Loading Readers <Spinner/></Box>
          }/>
          </Box>
        );
      case 'paying-invoice':
        return (
            <Box css={{textAlign:"center"}}>
            <Banner type="default" description={
              <Box>Paying invoice... <Spinner/></Box>
            }/>
            </Box>
        );
      case 'cancelling':
        return (
          <Box css={{textAlign:"center"}}>
          <Banner type="default" description={
            <Box>Canceling transaction... <Spinner/></Box>
          }/>
          </Box>
        );
      case 'ready':
        return (
          <Box css={{
            stack: 'y',
            gap: 'medium'
          }}>
            <Select name="reader" label="Reader" onChange={(e) => {
              const foundReader = readers.find(el => el.id == e.target.value);
              setSelectedReader(foundReader as Stripe.Terminal.Reader);
            }}>
            {readers.map((reader) => (
              <option key={reader.id} value={reader.id}>{reader.label}</option>
            ))}
            </Select>
            <TextField
              label="Amount"
              defaultValue="1.00"
              css={{width:'1/2'}}
              type="number"
              onChange={(e) => {
                setAmount(parseFloat(e.target.value).toFixed(2)*100);
              }}/>
            <Button type="primary"
              onPress={processPaymentIntent} 
              css={{width:'fill'}}>Capture Payment</Button>
            <Button type="primary"
              onPress={processSetupIntent} 
              css={{width:'fill'}}
              type="secondary">Capture Payment Method</Button>
          </Box>
        );
      case 'charging':
        if (selectedReader?.device_type == 'simulated_wisepos_e') {
          simulatePaymentButton = <Button type="secondary" onPress={simulatePresentPaymentMethod} css={{width:'fill'}}>Simulate Payment Method</Button>;
        }
        if (error) {
          errorMessage = <Banner type="critical" description={<Box>{error}</Box>}/>
        }
        return (
          <Box css={{
            stack: 'y',
            gap: 'medium'
            }}>
            <Banner type="default" description={
              <Box>Waiting for payment method on terminal {selectedReader?.label}. <Spinner/> </Box>
            }/>
            {errorMessage}
            <Button type="primary" onPress={reset} css={{width:'fill'}}>Cancel</Button>
            {simulatePaymentButton}
          </Box>
        );
      case 'payment-method-collected':
        return (
          <Box>
            <Banner type="default" description={
              <Box>A new payment method has been collected.</Box>
            }/>
          </Box>
        );
      case 'payment-collected':
        return (
          <Box css={{
            stack: 'y',
            gap: 'medium'
          }}>
            <Banner type="default" description={
              <Box>Payment was captured successfully.</Box>
            }/>
            <Button type="primary"
              onPress={reset}
              css={{width:'fill'}}>Start Over</Button>
          </Box>
        );
    }
  };

  return (
    <ContextView
      title="Terminal"
      brandColor="#F6F8FA"
      brandIcon={BrandIcon}
    >
      <Box>{actions(state)}</Box>
    </ContextView>
  );

};

export default Customer;
