import * as dotenv from "dotenv";
import * as Ably from "ably/promises";
import { HandlerEvent, HandlerContext } from "@netlify/functions";
import { CHANNEL, EVENT, HEADERS } from "../../utils/constants";
import { Message } from "../../utils/types";
  
dotenv.config();

function formatMessage(data: string, origin="server", nickname="Server") {
  return JSON.stringify({
    timestamp: Date(),
    origin,
    nickname,
    data
  });
}

function publish(message: string, origin: string, sender: string) {
  const formattedMessage = formatMessage(message, origin, sender);
  console.log(formattedMessage);
  const ably = new Ably.Realtime(process.env.ABLY_API_KEY_PUBLISH as string);
  const channel = ably.channels.get(CHANNEL);
  channel.publish(EVENT, formattedMessage,
    (err) => {
      if (err) {
        console.log(err);
      }
    }
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
      console.log(`ERROR: Invalid JSON: ${error}`);
      return formatMessage("Error: Invalid message format");
  }

  switch (msg.command) {
      case "move":
          // TODO
          break;
      case "nick":
          if (msg.params?.nickname) {
              return changeNick(msg.params.nickname, msg.sender);
          } else {
              console.log("ERROR: Missing nickname");
              return formatMessage("Error: Missing nickname");
          }
      case "message":
          if (msg.params?.message) {
              publish(msg.params.message, "user", msg.sender);
              return JSON.stringify({message: 'Message published'});
          } else {
              console.log("ERROR: Empty message");
              return formatMessage("Error: Empty message");
          }
      case "connect":
          publish(`${msg.sender} has connected`, "server", msg.sender);
          return JSON.stringify({message: "Connection broadcast"});
      case "disconnect":
          publish(`${msg.sender} has disconnected`, "server", msg.sender);
          return JSON.stringify({message: "Disconnection broadcast"});  
      default:
          console.log("ERROR: Invalid command");
          return formatMessage("Error: Invalid command.");
  }
}

/**
 * Manages incoming messages and optionally publishes to Ably channel
 */
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
  // const clientId = event.queryStringParameters?.["clientId"] || process.env.DEFAULT_CLIENT_ID || "NO_CLIENT_ID";

  const responseMessage = await parseIncomingMessage(event.body);
  
  return {
    statusCode: 200,
    headers: HEADERS,
    body: responseMessage
  }
}