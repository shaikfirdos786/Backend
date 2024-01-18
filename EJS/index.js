import express from 'express';

const app = express();

const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const d = new Date();
let day = weekday[d.getDay()];


let type = "a weekday";
let adv = "its time to work hard";

if(day === "Sunday" || day === "Saturday"){
    type = "the Weekend";
    adv = "it's time to have some fun"
}

app.get('/', (req, res)=>{
    res.render("index.ejs", {dayType: type, advice: adv,})
})

app.listen(3000, ()=>{
    console.log("listening on port 3000...")
})