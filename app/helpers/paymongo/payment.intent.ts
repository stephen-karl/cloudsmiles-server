import axios from "axios";

export const createPaymentIntent = async ( amount: number ) => {
  const paymentIntentResponse = await axios.post(
    'https://api.paymongo.com/v1/payment_intents',
    {
      data: {
        attributes: {
          amount: amount,
          payment_method_allowed: ['grab_pay', 'qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash'],
          currency: 'PHP',
          capture_type: 'automatic',
        },
      },
    },
    {
      auth: {
        username: process.env.PAYMONGO_CLIENT_SECRET || "",
        password: "",
      },
    }
  );
  console.log("[1] Done getting payment intent id");

  return paymentIntentResponse.data.data.id
}

export const attachPaymentIntent = async ( paymentIntentId: string, paymentMethodId: string) => {

  const attachPaymentIntentResponse = await axios.post(
    `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`,
    {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: "https://www.google.com",
        },
      },
    },
    {
      auth: {
        username: process.env.PAYMONGO_CLIENT_SECRET || "",
        password: "",
      },
    }
  );
  
  console.log("[3] Done getting payment intent id");
  return attachPaymentIntentResponse.data.data.attributes.next_action.redirect.url
}

export const getPaymentIntent = async ( paymentIntentId: string ) => {
  const paymentIntentResponse = await axios.get(
    `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`,
    {
      auth: {
        username: process.env.PAYMONGO_CLIENT_SECRET || "",
        password: "",
      },
    }
  );
  
  console.log("[3] Done getting payment intent id");
  return paymentIntentResponse.data.data.attributes.status

}