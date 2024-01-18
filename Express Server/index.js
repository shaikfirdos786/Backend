import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res)=> {
    res.send("<h1>Hello World!</h1>");
})

app.get("/about", (req, res)=> {
    res.send("<h1>Iam Nawab</h1>");
})

app.get("/contact", (req, res)=> {
    res.send("<h3>You can connect with me on LinkedIn</h3>")
})

app.listen(port, ()=> {
    console.log(`Server running on port ${port}.`);
})