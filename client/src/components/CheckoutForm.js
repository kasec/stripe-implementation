import React, { useEffect, useState, createRef } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./CheckoutForm.css";
import api from "../api";

export default function CheckoutForm() {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  
  const nameInput = createRef();

  useEffect(() => {
    // Step 1: Fetch product details such as amount and currency from
    // API to make sure it can't be tampered with in the client.
    api.getProductDetails().then((productDetails) => {
      setAmount(productDetails.amount / 100);
      setCurrency(productDetails.currency);
    });

    // Step 2: Create PaymentIntent over Stripe API
    api
      .createPaymentIntent()
      .then((clientSecret) => {
        setClientSecret(clientSecret);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);
    console.log({name: nameInput.current.value})
    // Step 3: Use clientSecret from PaymentIntent and the CardElement
    // to confirm payment with stripe.confirmCardPayment()
    const payload = nameInput.current.value ? await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: ev.target.name.value,
        },
      },
    }) : { error: { message: 'Ingrese el nombre' } }

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
      console.log("[error]", payload.error);
    } else {
      setError(null);
      setSucceeded(true);
      setProcessing(false);
      setMetadata(payload.paymentIntent);
      console.log("[PaymentIntent]", payload.paymentIntent);
    }
  };

  const renderSuccess = () => {
    return (
      metadata && <div className="sr-field-success message">
        <h1>Tu pago a sido exitoso!</h1>
        <p>Detalles:</p>
        <pre className="sr-callout">
          Tu haz pagado: <code>$ {metadata.amount / 100} {metadata.currency}</code>
        </pre>
      </div>
    );
  };

  const renderForm = () => {
    const options = {
      style: {
        base: {
          color: "#32325d",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a",
        },
      },
    };

    return (
      <form onSubmit={handleSubmit}>
        <h1>
          {currency.toLocaleUpperCase()}{" "}
          {amount.toLocaleString(navigator.language, {
            minimumFractionDigits: 2,
          })}{" "}
        </h1>
        <h4>Ingrese los datos aqui abajo.</h4>

        <div className="sr-combo-inputs">
          <div className="sr-combo-inputs-row">
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ingresa tu Nombre aqui"
              autoComplete="cardholder"
              className="sr-input"
              ref={nameInput}
            />
          </div>

          <div className="sr-combo-inputs-row">
            <CardElement
              className="sr-input sr-card-element"
              options={options}
            />
          </div>
        </div>

        {error && <div className="message sr-field-error">{error}</div>}

        <button
          className="btn"
          disabled={processing || !clientSecret || !stripe}
        >
          {processing ? "Porcesando…" : "Pagar"}
        </button>
      </form>
    );
  };

  return (
    <div className="checkout-form">
      <div className="sr-payment-form">
        <div className="sr-form-row" />
        {succeeded ? renderSuccess() : renderForm()}
      </div>
    </div>
  );
}
