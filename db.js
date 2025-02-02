require('dotenv').config();  // Load environment variables from .env file
const { Client } = require('pg');  


const client = new Client({
    user: process.env.DB_USER,  // Pulls from .env file
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Connect to the PostgreSQL database
client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Error connecting to the database:', err.stack));


module.exports = client;

