import * as dotenv from "dotenv";
import * as Ably from "ably/promises";
import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { HEADERS } from "../../utils/constants";

type Message = {
  sender: string;
  command: string;
  params?: {
    message?: string;
    nickname?: string;
  }
}

const CHANNEL = 'getting-started';
const EVENT = 'greeting';
  
dotenv.config();

const formatMessage = (data, origin="server", nickname="Server") =>
  JSON.stringify({
    timestamp: Date(),
    origin: origin,
    nickname: nickname,
    data: data
})


function publish(message: string, origin: string, sender: string) {
  const formattedMessage = formatMessage(message, origin, sender);
  const ably = new Ably.Realtime(process.env.ABLY_API_KEY_PUBLISH as string);
  const channel = ably.channels.get(CHANNEL);
  channel.publish(EVENT, formattedMessage,
  //   (err) => {
  //   if (err) {
  //     console.log(err);
  //   }
  // }
  );
}

function changeNick(newNick: string, oldNick: string) {
  console.log(`${oldNick} changed nick to ${newNick}`);
  publish(`${oldNick} changed nick to ${newNick}`, "server", newNick);
  return formatMessage(`Nick changed to ${newNick}`);
}

async function parseIncomingMessage(message: string) {
  let msg: Message;

  try {
      msg = JSON.parse(message);
  } catch (error) {
      console.log(`Invalid JSON: ${error}`);
      return formatMessage("Error: Invalid message format");
  }

  switch (msg.command) {
      case "nick":
          if (msg.params?.nickname) {
              return changeNick(msg.params.nickname, msg.sender);
          } else {
              console.log("Missing nickname");
              return formatMessage("Error: Missing nickname");
          }
      case "message":
          if (msg.params?.message) {
              publish(msg.params.message, "user", msg.sender);
              return JSON.stringify({message: 'Message published'});
          } else {
              console.log("Empty message");
              return formatMessage("Error: Empty message");
          }
      default:
          console.log("Invalid command");
          return formatMessage("Error: Invalid command.");
  }
}

export async function handler(event: HandlerEvent, _: HandlerContext) {
  if (!process.env.ABLY_API_KEY_PUBLISH) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify(`Server missing ABLY_API_KEY_PUBLISH`)
    }
  }

  if (event.httpMethod === 'OPTIONS' || !event.body) {
    return {
      statusCode: 200,
      headers: HEADERS,
    };
  }

  // TODO implement or remove
  const clientId = event.queryStringParameters?.["clientId"] || process.env.DEFAULT_CLIENT_ID || "NO_CLIENT_ID";

  const responseMessage = await parseIncomingMessage(event.body);
  
  return {
    statusCode: 200,
    headers: HEADERS,
    body: responseMessage
  }
}