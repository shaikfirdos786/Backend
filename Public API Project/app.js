import express from "express";
import axios from "axios";

const app = express();
const port = 3000; // Change to your desired port


app.use(express.static("public"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

const baseURL = "https://v2.jokeapi.dev";
const categories = [
  "Programming",
  "Misc",
  "Pun",
  "Spooky",
  "Christmas",
  "Any",
  "Dark",
];
const params = ["blacklistFlags=nsfw,religious,racist"];


app.get("/", async (req, res) => {
  const apiUrl = `${baseURL}/joke/${categories.join(",")}?${params.join("&")}`;
  try {
    const result = await axios.get(apiUrl);
    const response = result.data;
    if (response.type === "single") {
      res.render("index.ejs", { joke: response.joke });
    } else {
      res.render("index.ejs", {
        setup: response.setup,
        delivery: response.delivery,
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the joke." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
