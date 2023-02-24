import * as dotenv from "dotenv";
import * as Ably from "ably/promises";
import { HandlerEvent, HandlerContext } from "@netlify/functions";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'content-type': 'application/json'
};

dotenv.config();

export async function handler(event: HandlerEvent, context: HandlerContext) {
  if (!process.env.ABLY_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(`Server missing ABLY_API_KEY`)
    }
  }

  const clientId = event.queryStringParameters?.["clientId"] || process.env.DEFAULT_CLIENT_ID || "NO_CLIENT_ID";
  const client = new Ably.Rest(process.env.ABLY_API_KEY);
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: clientId });
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(tokenRequestData)
  };
}