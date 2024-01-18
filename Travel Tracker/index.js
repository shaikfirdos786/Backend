import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { name } from "ejs";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Nawab",
  password: "Firdos@03",
  port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  //Write your code here.
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(result.rows);
  console.log(countries);
  res.render("index.ejs", {countries: countries, total: countries.length});
});

app.post("/add", async (req, res) => {
  const country_name = req.body.country;
  console.log(country_name);

  try {
    const queryResult = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ",
      [country_name.toLowerCase()]
    );

    if (queryResult.rows.length > 0) {
      const country_code = queryResult.rows[0].country_code;
      console.log(country_code);
      
      await db.query("INSERT INTO visited_countries(country_code) VALUES($1)", [country_code]);
      res.redirect("/");
    } else {
      console.log("Country not found in the database.");
      const countries = await checkVisisted();
      res.render("index.ejs", {countries: countries, total: countries.length, error: "Country not found in the database.",});
      // Handle the case where the country is not found.
    }
  } catch (error) {
    console.error("Error executing query", error.stack);
    const countries = await checkVisisted();
    res.render("index.ejs", {countries: countries, total: countries.length, error: "Country has already been added, try again."});
    // Handle the database query error here
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
