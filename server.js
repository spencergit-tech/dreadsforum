const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Set up database connection using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ Use Render's database URL
  ssl: {
    rejectUnauthorized: false, // ✅ Required for Render
  },
});

// Test database connection
pool.query('SELECT current_database()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to database:', res.rows[0].current_database);
  }
});

// Set up CORS to allow frontend to make requests to this API
const corsOptions = {
  origin: 'https://spencergit-tech.github.io', // Your frontend URL
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Create 'uploads' folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Root route
app.get('/', (req, res) => {
  res.send('Backend API is working!');
});

// Debugging route to check database connection and schema
app.get('/api/debug', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT current_database()');
    const schemaCheck = await pool.query(
      "SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'threads'"
    );
    res.json({
      connectedDatabase: dbCheck.rows[0].current_database,
      threadsTableExists: schemaCheck.rows.length > 0,
      schemaCheck: schemaCheck.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Database debug error', error: error.message });
  }
});

// Set up multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder to save the images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

// API endpoint to create a new thread
app.post('/api/threads', async (req, res) => {
  const { username, subject, comment } = req.body;

  if (!username || !subject || !comment) {
    return res.status(400).json({ message: 'Username, subject, and comment are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO public.threads (username, subject, comment) VALUES ($1, $2, $3) RETURNING *',
      [username, subject, comment]
    );

    res.status(201).json(result.rows[0]); // Return the created thread details
  } catch (error) {
    console.error('❌ Error creating thread:', error);
    res.status(500).json({ message: 'Error creating thread', error: error.message });
  }
});

// API endpoint to fetch all threads
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, subject, comment, timestamp, votes FROM public.threads ORDER BY timestamp DESC'
    );
    res.status(200).json(result.rows); // Return all threads
  } catch (error) {
    console.error('❌ Error fetching threads:', error);
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

// Serve static files (images) from the "uploads" folder
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
