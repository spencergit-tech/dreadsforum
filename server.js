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

// API endpoint to create a new thread (image is OPTIONAL)
app.post('/api/threads', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Error uploading image', error: err.message });
    }

    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null; // Only add image if uploaded

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
      // Insert thread data into the database, allowing `image` to be NULL
      const result = await pool.query(
        'INSERT INTO threads (title, content, image) VALUES ($1, $2, $3) RETURNING *',
        [title, content, image]
      );

      res.status(201).json(result.rows[0]); // Return the created thread details
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating thread', error: error.message });
    }
  });
});

// API endpoint to fetch all threads
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threads ORDER BY created_at DESC');
    res.status(200).json(result.rows); // Return all threads, ordered by creation time
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

// Serve static files (images) from the "uploads" folder
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
