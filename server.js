// Stack: Node.js 20, Express 4, Mongoose 8

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// -----------------------------------------------------------------------------
// 1. CONFIGURATION & ENVIRONMENT
// -----------------------------------------------------------------------------
// We use 'dotenv' to load secret keys from the .env file.
// This ensures sensitive data (like DB passwords) are not hardcoded in Git.
dotenv.config();

const app = express();
// Use the PORT provided by the Cloud Provider (Render), or default to 3000 locally
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------------------------
// 2. MIDDLEWARE PIPELINE
// -----------------------------------------------------------------------------
// View Engine: Tells Express to use EJS to render dynamic HTML pages
app.set('view engine', 'ejs');

// Body Parser: Essential for handling Form POSTs. 
// It converts raw form data into a JavaScript object accessible via 'req.body'
app.use(express.urlencoded({ extended: true })); 

// Static Files: Serves images, CSS, or JS files from the 'public' folder
app.use(express.static('public')); 

// -----------------------------------------------------------------------------
// 3. DATABASE CONNECTION (Cloud Resource)
// -----------------------------------------------------------------------------
// Connects to the MongoDB Atlas cluster using the Connection String URI.
// The 'async' function allows us to wait for the connection before proceeding.
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If connection fails (e.g., bad password, no internet), stop the app
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// -----------------------------------------------------------------------------
// 4. DATA MODEL (Schema)
// -----------------------------------------------------------------------------
// Defines the structure of a 'Patient' document in our NoSQL database.
// This enforces data integrity (validation) at the application level.
const patientSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, 'Patient name is required'], // Validation rule
        trim: true 
    },
    age: { type: Number, required: true },
    condition: { type: String, required: true },
    // Enum ensures only valid departments are saved
    department: {
        type: String,
        enum: ['Emergency', 'ICU', 'Cardiology', 'Pediatrics', 'Neurology', 'General Ward'],
        default: 'General Ward',
        required: true
    },
    status: { 
        type: String, 
        enum: ['Admitted', 'Discharged', 'Critical', 'Outpatient', 'Recovery'],
        default: 'Admitted'
    },
    // NEW FEATURE: Clinical Vitals
    vitals: {
        heartRate: { type: Number, default: 0 },      // BPM
        bloodPressure: { type: String, default: 'N/A' }, // e.g. 120/80
        temperature: { type: Number, default: 36.5 }  // Celsius
    },
    roomNumber: { type: String, default: 'TBA' },
    notes: { type: String, trim: true },
    // Automatically sets the timestamp when the record is created
    admissionDate: { type: Date, default: Date.now }
});

// Compile the schema into a Model. This Object is what we use to query the DB.
const Patient = mongoose.model('Patient', patientSchema);

// -----------------------------------------------------------------------------
// 5. ROUTING (Controller Logic)
// -----------------------------------------------------------------------------

/**
 * GET /
 * Purpose: Fetch all patients, apply filters, calculate analytics, and render Dashboard.
 */
app.get('/', async (req, res) => {
    try {
        let query = {};
        
        // INTERACTION: Search Logic
        // If user typed in search box, filter DB results using Regex (Pattern Matching)
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { fullName: searchRegex },
                { condition: searchRegex },
                { roomNumber: searchRegex }
            ];
        }

        // INTERACTION: Department Filter
        // If user selected a specific department, add it to the MongoDB query
        if (req.query.department && req.query.department !== 'All') {
            query.department = req.query.department;
        }

        // Fetch data: Find patients matching 'query', sort by newest admission first
        const patients = await Patient.find(query).sort({ admissionDate: -1 });

        // ANALYTICS: Calculate stats based on the fetched data
        const stats = {
            total: patients.length,
            critical: patients.filter(p => p.status === 'Critical').length,
            icu: patients.filter(p => p.department === 'ICU').length,
            admitted: patients.filter(p => p.status === 'Admitted').length
        };

        // Render the 'index.ejs' file, passing in the data
        res.render('index', { 
            patients, 
            search: req.query.search,
            currentDept: req.query.department || 'All',
            stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

/**
 * POST /add
 * Purpose: Receive form data and create a new patient in the cloud database.
 */
app.post('/add', async (req, res) => {
    try {
        // req.body contains the form inputs thanks to express.urlencoded middleware
        await Patient.create(req.body);
        res.redirect('/'); // Refresh page to show new data
    } catch (err) {
        console.error(err);
        res.redirect('/?error=Failed to add patient');
    }
});

/**
 * GET /edit/:id
 * Purpose: Fetch a specific single patient to pre-fill the Edit Form.
 */
app.get('/edit/:id', async (req, res) => {
    try {
        // 'req.params.id' captures the ID from the URL
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.redirect('/');
        res.render('edit', { patient });
    } catch (err) {
        res.redirect('/');
    }
});

/**
 * POST /edit/:id
 * Purpose: Find the specific patient and update their details.
 */
app.post('/edit/:id', async (req, res) => {
    try {
        // runValidators: true ensures the new data still obeys our Schema rules
        await Patient.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect(`/edit/${req.params.id}`);
    }
});

/**
 * POST /delete/:id
 * Purpose: Permanently remove a record from the database.
 */
app.post('/delete/:id', async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// -----------------------------------------------------------------------------
// 6. SERVER INITIALIZATION
// -----------------------------------------------------------------------------
// Only start listening for user requests AFTER the database connects successfully.
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`EHR Server running on port ${PORT}`);
        console.log(`Open your browser and type: http://localhost:${PORT} 🚀`);
    });
});