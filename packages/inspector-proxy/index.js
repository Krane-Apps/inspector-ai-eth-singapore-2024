require('dotenv').config();
const express = require('express');

const app = express();
const port = 6000;

const headers = {
    "Authorization": process.env.ONE_INCH_AUTHORIZATION,
    "Content-Type": "application/json"
};

// WorldID app ID and action from .env file
const WORLD_ID_APP_ID = process.env.WORLD_ID_APP_ID;
const WORLD_ID_ACTION = process.env.WORLD_ID_ACTION;

// Middleware to handle request bodies
app.use(express.json());

// Middleware for URL validation
app.use((req, res, next) => {
    const url = req.query.url;
    next();
});

app.get('/', async (req, res) => {
    try {
        const response = await fetch(req.query.url, { headers });
        const data = await response.json();
        if (!response.ok) {
            console.error(`Invalid response: ${response.status} ${response.statusText}`);
            console.error('Response data:', data);
        }
        return res.send(data);
    } catch (error) {
        console.error('Error occurred while fetching data:', error);
        return res.status(500).send('Error occurred while fetching data: ' + JSON.stringify(error));
    }
});

app.post('/', async (req, res) => {
    try {
        const response = await fetch(req.query.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body.data)
        });
        const data = await response.json();
        if (!response.ok) {
            console.error(`Invalid response: ${response.status} ${response.statusText}`);
            console.error('Response data:', data);
        }
        return res.send(data);
    } catch (error) {
        console.error('Error occurred while fetching data:', error);
        return res.status(500).send('Error occurred while fetching data: ' + JSON.stringify(error));
    }
});

// New worldId endpoint
app.post('/worldId', async (req, res) => {
    try {
        const proof = req.body;
        const verified = await verifyProof(proof);

        if (verified) {
            // Proof is valid, proceed with your application logic
            res.json({ success: true, message: "Proof verified successfully" });
        } else {
            console.error('Invalid proof received:', proof);
            res.status(400).json({ success: false, message: "Invalid proof" });
        }
    } catch (error) {
        console.error('Error in worldId endpoint:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verification function
const verifyProof = async (proof) => {
    console.log('proof', proof);
    const response = await fetch(
        `https://developer.worldcoin.org/api/v1/verify/${WORLD_ID_APP_ID}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...proof, action: WORLD_ID_ACTION }),
        }
    );
    if (response.ok) {
        const verified = await response.json();
        return verified;
    } else {
        const { code, detail } = await response.json();
        console.error(`Error in verifyProof: Code ${code}, Detail: ${detail}`);
        throw new Error(`Error Code ${code}: ${detail}`);
    }
};

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
