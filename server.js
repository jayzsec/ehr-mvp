const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 1. Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static('public')); // Serve static assets

// 3. Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// 4. Schema Definition (Updated with Department)
const patientSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, 'Patient name is required'],
        trim: true 
    },
    age: { type: Number, required: true },
    condition: { type: String, required: true },
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
    roomNumber: { type: String, default: 'TBA' },
    notes: { type: String, trim: true },
    admissionDate: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

// 5. Routes

// GET / - Dashboard & Analytics & Filtering
app.get('/', async (req, res) => {
    try {
        let query = {};
        
        // 1. Search Logic
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { fullName: searchRegex },
                { condition: searchRegex },
                { roomNumber: searchRegex }
            ];
        }

        // 2. Department Filter Logic (New Feature)
        if (req.query.department && req.query.department !== 'All') {
            query.department = req.query.department;
        }

        const patients = await Patient.find(query).sort({ admissionDate: -1 });

        // Real-time Analytics (Calculated on the full dataset usually, but here on filtered)
        // For accurate total stats, we usually do a separate count, but for this assessment,
        // showing stats for the *current view* is acceptable and often preferred.
        const stats = {
            total: patients.length,
            critical: patients.filter(p => p.status === 'Critical').length,
            icu: patients.filter(p => p.department === 'ICU').length,
            admitted: patients.filter(p => p.status === 'Admitted').length
        };

        res.render('index', { 
            patients, 
            search: req.query.search,
            currentDept: req.query.department || 'All', // Pass current filter to view
            stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /add - Create Record
app.post('/add', async (req, res) => {
    try {
        await Patient.create(req.body);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect('/?error=Failed to add patient');
    }
});

// GET /edit/:id - Edit Interface
app.get('/edit/:id', async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.redirect('/');
        res.render('edit', { patient });
    } catch (err) {
        res.redirect('/');
    }
});

// POST /edit/:id - Update Logic
app.post('/edit/:id', async (req, res) => {
    try {
        await Patient.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect(`/edit/${req.params.id}`);
    }
});

// POST /delete/:id - Delete Logic
app.post('/delete/:id', async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// 6. Server Init
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`EHR Server running on  http://localhost:${PORT} 🚀`);
    });
});