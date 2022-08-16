from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys
import json
import stripe

load_dotenv()

stripe.api_key = os.getenv('STRIPE_API_KEY')
stripe_signing_secret = os.getenv('STRIPE_APP_SIGNING_SECRET')

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

@app.before_request
def _validate_signature():
    if request.method == 'OPTIONS':
        return
    if stripe.api_key==None or stripe_signing_secret==None:
        print('Unable to load API keys from environment file. Make sure you have created a .env file in the /backend folder.')
        return '', 500
    body = request.get_json()
    stripe_signature = request.headers.get('stripe-signature')
    signature_payload = json.dumps({
        'user_id': body['user_id'],
        'account_id': body['account_id']
    },separators=(',',':'))
    stripe.WebhookSignature.verify_header(signature_payload,stripe_signature,stripe_signing_secret)        

@app.route("/display_cart", methods=['POST'])
def display_cart():
    try:
        body = request.get_json()
        payload = body['payload']
        return jsonify(response)
    except Exception as e:
        print(e)
        return str(e), 500
    
@app.route("/process_setup_intent", methods=['POST'])
def process_setup_intent():
    try:
        body = request.get_json()
        payload = body['payload']
        response = stripe.terminal.Reader.process_setup_intent(
            payload['reader'],
            **payload['process_setup_intent_params']
        )
        return jsonify(response)
    except Exception as e:
        print(e)
        return str(e), 500

@app.route("/process_payment_intent", methods=['POST'])
def process_payment_intent():
    try:
        body = request.get_json()
        payload = body['payload']
        response = stripe.terminal.Reader.process_payment_intent(
            payload['reader'],
            **payload['process_payment_intent_params']
        )
        return jsonify(response)
    except Exception as e:
        print(e)
        return str(e), 500

@app.route("/cancel_action", methods=['POST'])
def cancel_action():
    try:
        body = request.get_json()
        payload = body['payload']
        response = stripe.terminal.Reader.cancel_action(
            payload['reader']
        )
        return jsonify(response)
    except Exception as e:
        print(e)
        return str(e), 500

@app.route("/list_readers", methods=['POST'])
def list_readers():
    try:
        body = request.get_json()
        payload = body['payload']
        response = stripe.terminal.Reader.list(
            **payload['reader_list_params']
        )
        return jsonify(response.data)
    except Exception as e:
        print(e)
        return str(e), 500

@app.route("/simulate_present_payment_method", methods=['POST'])
def simulate_present_payment_method():
    try:
        body = request.get_json()
        payload = body['payload']
        response = stripe.terminal.Reader.TestHelpers.present_payment_method(
            payload['reader']
        )
        return jsonify(response)
    except Exception as e:
        print(e)
        return str(e), 500
