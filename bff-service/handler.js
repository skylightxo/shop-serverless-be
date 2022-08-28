const fetch = require("node-fetch");
const express = require("express");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.all("/*", async (req, res) => {
  const { body, originalUrl, method } = req;

  console.log("BODY: ", body, "OG_URL: ", originalUrl, "METHOD: ", method);

  const recipient = originalUrl.split("/")[1];
  const recipientUrl = process.env[recipient];

  console.log("RECEPIENT: ", recipient, "RECEPIENT_URL: ", recipientUrl);

  if (recipientUrl) {
    try {
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify(body || {}),
      });
      const data = await response.json();

      console.log("DATA: ", data);

      res.json(data);
    } catch (err) {
      console.log("ERROR: ", JSON.stringify(err));

      if (err.response) {
        const { status, data } = err.response;
        res.status(status).json(data);
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`app is listening at http://localhost:${PORT}`);
});
