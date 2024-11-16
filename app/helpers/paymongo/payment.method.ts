import axios from "axios";

export const createPaymentMethod = async ( type: string ) => {
  const paymentMethodResponse = await axios.post(
    'https://api.paymongo.com/v1/payment_methods',
    {
      data: {
        attributes: {
          type: type,
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

  console.log("[2] Done getting payment method id");
  return paymentMethodResponse.data.data.id
}