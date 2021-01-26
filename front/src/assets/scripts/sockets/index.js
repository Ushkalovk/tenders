import { template } from "../tendersTemplate";
import io from "socket.io-client";
import { createErrorMessage } from "../error";

const socket = io.connect("http://194.87.236.64", {
  upgrade: false,
  transports: ["websocket"],
});

let connectErrorCount = 0;

socket.on("connect_error", () => {
  console.log("Connection Failed");
  connectErrorCount++;

  if (connectErrorCount >= 5) {
    socket.disconnect();
    console.log("stop reconection");
  }
});

socket.on("reconnect", () => {
  console.log("reconnect");
  connectErrorCount = 0;
});

socket.on("message", (data) => {
  const parseData = JSON.parse(data);

  parseData.message && createErrorMessage(parseData.message);

  template.dispatch(parseData);
});
