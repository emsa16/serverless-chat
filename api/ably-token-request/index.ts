import * as dotenv from "dotenv";
import * as Ably from "ably/promises";
import { HandlerEvent, HandlerContext } from "@netlify/functions";

const headers = {
  'Access-Control-Allow-Origin': '*', // TODO restrict
  'Content-Type': 'application/json'
};

dotenv.config();

export async function handler(event: HandlerEvent, _: HandlerContext) {
  if (!process.env.ABLY_API_KEY_SUBSCRIBE) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(`Server missing ABLY_API_KEY_SUBSCRIBE`)
    }
  }

  const clientId = event.queryStringParameters?.["clientId"] || process.env.DEFAULT_CLIENT_ID || "NO_CLIENT_ID"; // TODO implement or remove
  const client = new Ably.Rest(process.env.ABLY_API_KEY_SUBSCRIBE);
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: clientId });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(tokenRequestData)
  };
}