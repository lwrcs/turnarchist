import { renderServerBanner } from "http/banner";
import { initializeHttpServer } from "./http";

const port = process.env.PORT || 3000;
const server = initializeHttpServer();

server.listen(port, () => {
  console.log(renderServerBanner(port));
});
