import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://secrets-api.appbrewery.com/";

//TODO 1: Fill in your values for the 3 types of auth.
const yourUsername = "firdos";
const yourPassword = "raza1234";
const yourAPIKey = "f0173b85-b64c-42c7-96f0-d0396182648c";
const yourBearerToken = "5236299e-9fed-4fdc-aa32-c1ecc5ac6d1e";

app.get("/", (req, res) => {
  res.render("index.ejs", { content: "API Response." });
});

app.get("/noAuth", async (req, res) => {
  //TODO 2: Use axios to hit up the /random endpoint
  //The data you get back should be sent to the ejs file as "content"
  //Hint: make sure you use JSON.stringify to turn the JS object from axios into a string.
  try {
    const response = await axios.get(
      "https://secrets-api.appbrewery.com/random"
    );
    const result = JSON.stringify(response.data);
    res.render("index.ejs", { content: result });
  } catch (error) {
    console.error("Failed to make request:", error.message);
  }
});

app.get("/basicAuth", async (req, res) => {
  //TODO 3: Write your code here to hit up the /all endpoint
  //Specify that you only want the secrets from page 2
  //HINT: This is how you can use axios to do basic auth:
  // https://stackoverflow.com/a/74632908
  /*
   axios.get(URL, {
      auth: {
        username: "abc",
        password: "123",
      },
    });
  */

    try{
      const response = await axios.get("https://secrets-api.appbrewery.com/all?page=2", {auth: {username: yourUsername, password: yourPassword}});
      const result = JSON.stringify(response.data);
      console.log(result);
      res.render("index.ejs", {content: result});
    }catch(error){
      console.log("Failed to make request: ", error.message);
    }
});

app.get("/apiKey", async (req, res) => {
  //TODO 4: Write your code here to hit up the /filter endpoint
  //Filter for all secrets with an embarassment score of 5 or greater
  //HINT: You need to provide a query parameter of apiKey in the request.
  try{
    const response = await axios.get(
      "https://secrets-api.appbrewery.com/filter",
      {
        params: {
          score: 5,
          apiKey: yourAPIKey,
        }
      }
    );
    const result = JSON.stringify(response.data);
    console.log(result);
    res.render("index.ejs", {content: result});
  }catch(error){
    console.log("Failed to make request: ", error.message);
  }
});

const config = {
  headers: { Authorization: `Bearer ${yourBearerToken}` },
};

app.get("/bearerToken", async (req, res) => {
  //TODO 5: Write your code here to hit up the /secrets/{id} endpoint
  //and get the secret with id of 42
  //HINT: This is how you can use axios to do bearer token auth:
  // https://stackoverflow.com/a/52645402
  /*
  axios.get(URL, {
    headers: { 
      Authorization: `Bearer <YOUR TOKEN HERE>` 
    },
  });
  */

  try{
    const response = await axios.get(
      "https://secrets-api.appbrewery.com/secrets/2", config);
    const result = JSON.stringify(response.data);
    console.log(result);
    res.render("index.ejs", {content: result});
  }catch(error){
    console.log("Failed: ", error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
