import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Nawab786@", // Change this to a random, secure value
    resave: false,
    saveUninitialized: true,
  })
);


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ReadingNook",
  password: "Firdos@03",
  port: 5432,
});
db.connect();

let loggedIn;
let books;

db.query("SELECT * FROM books ORDER BY id", (err, res) => {
  if(err){
    console.log("Error executing query");
  }else{
    books = res.rows;
  }
});

app.get("/", (req, res) => {
  try {
    res.render("index.ejs", { loggedIn: req.session.user, books: books });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/about", (req, res) => {
    res.render("about.ejs", { loggedIn: req.session.user });
});

app.get("/contact", (req, res) => {
    res.render("contact.ejs", { loggedIn: req.session.user });
});

app.post("/login", async (req, res) => {
  const email = req.body.loginEmail;
  const password = req.body.loginPassword;

  try {
    const user = await db.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 1) {
      const passwordUser = user.rows[0].password;

      if (password === passwordUser) {
        // Passwords match - user is authenticated
        req.session.user = user.rows[0].name;
        console.log(req.session.user);
        res.redirect("/");
      } else {
        console.log("Invalid password");
        res.status(401).send("Invalid password");
      }
    } else {
      console.log("Invalid user");
      res.status(401).send("Invalid user");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/filter", async (req, res) => {
  const type = req.body.filter;
  
  try{
    let query;
    switch(type){
      case "Title":
        query = "SELECT * FROM books ORDER BY book_name";
        break;
      case "Newest":
        query = "SELECT * FROM books ORDER BY date_read DESC";
        break;
      case "Best":
        query = "SELECT * FROM books ORDER BY rating DESC";
        break;
      default:
        query = "SELECT * FROM books ORDER BY id ";
        break;
    }

    const result = await db.query(query);
    books = result.rows;
    res.redirect("/");
  }catch(err){
    console.log(err);
    res.redirect("/");
  }
});

app.post("/search", async (req, res) => {
    const text = req.body.searchText;
    try{
      const result = await db.query("SELECT * FROM books WHERE LOWER(book_name) LIKE '%' || $1 || '%' ", [text.toLowerCase()]);
      if(result.rows.length === 1){
        res.render("book.ejs", {books: result.rows});
      }else{
        console.log("No data found");
        res.status(401).send("No Book Found");
      }
    }catch(err){
      console.log(err);
    }
});

app.post("/add", async (req, res) => {
  const book_name = req.body.title;
  const author_name = req.body.author;
  const isbn = req.body.bookId;
  const rating = req.body.rating;
  const img_id = req.body.imgId;
  const summary = req.body.summary;
  try{
    const result = await db.query("INSERT INTO books(book_name, author_name, isbn, rating, img_id, summary) VALUES($1, $2, $3, $4, $5, $6)", [book_name, author_name, isbn, rating, img_id, summary]);
    const queryBooks = await db.query("SELECT * FROM books ORDER BY id");
    books = queryBooks.rows;
    res.redirect("/");
  }catch(err){
    console.log(err);
  }
});

app.post("/addNote", async (req, res) => {
  const bookId = req.body.bookId;
  const note = req.body.note;
  const result = await db.query("INSERT INTO notes(book_id, note) VALUES($1, $2)", [bookId, note]);
  res.redirect(`/notes/${bookId}`);
});

app.get("/notes/:id",async (req, res) => {
  const id = req.params.id;
  try{
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    const result2 = await db.query("SELECT * FROM notes WHERE book_id = $1", [id]);
    console.log(result2.rows);
    res.render("notes.ejs", {book: result.rows[0], notes: result2.rows, loggedIn: req.session.user});
  }catch(err){
    console.log(err);
  }
});

app.get("/deleteNote/:id", async (req, res) => {
  const bookId = req.params.id;
  const result = await db.query("DELETE FROM notes WHERE book_id = $1", [bookId]);
  res.redirect(`/notes/${bookId}`);
});

app.get("/logout", (req, res) => {
  // Destroy the entire session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.send("Error logging out");
    } else {
      res.redirect("/");
    }
  });
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
