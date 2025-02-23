const express = require("express");
const path = require('path');
const mysql = require("mysql");
const session = require('express-session');

const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jbje7Vc91jmXA8Ft',
    database:'online_banking'
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

//Parse URL-encoded-bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false}));
//Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(session({
    secret: '123456', // Replace 'your-secret-key' with a random string
    resave: false,
    saveUninitialized: false
}));
app.set('view engine', 'hbs');

db.connect( (error) => {
    if(error){
        console.log(error)
    } else {
        console.log("MYSQL Connected...")
    }
})

//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));




app.listen(3000, () =>{
    console.log("Server started on Port 3000");
})