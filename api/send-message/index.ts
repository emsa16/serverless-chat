import * as dotenv from "dotenv";
import * as Ably from "ably/promises";
import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { HEADERS } from "../../utils/constants";

const CHANNEL = 'getting-started';
const EVENT = 'greeting';
  
dotenv.config();

export async function handler(event: HandlerEvent, _: HandlerContext) {
  if (!process.env.ABLY_API_KEY_PUBLISH) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify(`Server missing ABLY_API_KEY_PUBLISH`)
    }
  }

  console.log(event.body);

  const clientId = event.queryStringParameters?.["clientId"] || process.env.DEFAULT_CLIENT_ID || "NO_CLIENT_ID"; // TODO implement or remove
  const ably = new Ably.Realtime(process.env.ABLY_API_KEY_PUBLISH);
  const channel = ably.channels.get(CHANNEL);
  channel.publish(EVENT, event.body, (err) => {
    if (err) {
      console.log(err);
    }
  });

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({message: 'ok'})
  };
}