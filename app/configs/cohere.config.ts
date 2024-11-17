import { CohereClient } from "cohere-ai";
import dotenv from 'dotenv';

dotenv.config()

export const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});
