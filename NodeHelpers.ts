import { ContentAPI_Session, ContentAPI_Socket } from "./Helpers";
import { LiveEvent } from "./Live/LiveEvent";
import { Content } from "./Views";
import WebSocket from "ws";
import FormData from "form-data";
import axios from "axios";

export class ContentAPI_Node_Socket extends ContentAPI_Socket<WebSocket> {
   closeSocket() {
      this.socket?.close();
   }

   newSocket(): WebSocket {
      let params = new URLSearchParams();
      params.set("token", this.token);
      if (this.lastId) {
         params.set("lastId", this.lastId.toString());
      }
      const socket = new WebSocket(`${this.api.wsPath}?${params.toString()}`);

      socket.on('message', (event) => {
         try {
            const res = JSON.parse(event.toString()) as LiveEvent;
            this.onMessage(res);
         } catch (err) {
            console.error(err);
         }
      })

      socket.on('error', this.onError)
      socket.on('close', this.onClose)

      return socket;
   }

   sendMessage(data: string) {
      this.whenReady(() => {
         this.socket?.send(data);
      });
   }
}

export const uploadFile = async (session: ContentAPI_Session, data: FormData, bucket?: string): Promise<string> => {
   if (bucket) {
      data.append("globalPerms", ".");
      data.append("values[bucket]", bucket);
   }
   const headers = {
      ...session.headers,
      "Content-Type": "multipart/form-data",
      ...data.getHeaders()
   };
   const res = await axios.post(`${session.api.path}/File`, data, { headers });
   const content = res.data as Content;
   return content.hash;
}