require('dotenv').config();  // Load environment variables from .env file
const { Client } = require('pg');  // PostgreSQL client

// Create a new client instance with your database credentials
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

// Export the client so it can be used in other parts of your app
module.exports = client;

