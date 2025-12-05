// To run this backend server, you need Node.js and several packages installed.
// Open a terminal in the project root directory and run:
// npm install busboy bcryptjs jsonwebtoken
// node workflows/main.js
// The server will start on http://localhost:3000.

const http = require('http');
const https = require('https');
const { URL } = require('url');
const Busboy = require('busboy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory storage
const users = {};
const surveys = [];
const jobs = [];
const chatHistories = {};
const researchChatHistories = {}; // Separate history for the research assistant

const JWT_SECRET = 'your-super-secret-key-that-should-be-in-an-env-file';

// --- DeepSeek API Configuration ---
const DEEPSEEK_API_KEY = "sk-3c594d38d93947d8b1b6bf93c161857b";
const DEEPSEEK_MODEL = "deepseek-chat"; // Or "deepseek-coder" for code-related tasks

const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- API ROUTING ---

    // Endpoint for User Signup
    if (reqUrl.pathname === '/api/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { name, email, password } = JSON.parse(body);
                if (!name || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Name, email, and password are required.' }));
                }
                if (users[email]) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'User with this email already exists.' }));
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                users[email] = { name, email, password: hashedPassword, createdAt: new Date() };
                console.log('New user registered:', users[email]);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User created successfully.' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request data.' }));
            }
        });
    }
    // Endpoint for User Login
    else if (reqUrl.pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { email, password } = JSON.parse(body);
                const user = users[email];

                if (!user || !await bcrypt.compare(password, user.password)) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Invalid email or password.' }));
                }

                const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Login successful.', token, name: user.name }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request data.' }));
            }
        });
    }
    // Endpoint for Creating Surveys
    else if (reqUrl.pathname === '/api/create-survey' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const surveyData = JSON.parse(body);
                
                // Basic validation
                if (!surveyData.title || !surveyData.questions || surveyData.questions.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Survey must have a title and at least one question.' }));
                }

                // Assign a unique ID and store the survey
                const newSurvey = {
                    id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...surveyData,
                    createdAt: new Date().toISOString(),
                    status: 'scheduled' // Initial status
                };
                surveys.push(newSurvey);

                console.log('New survey created:', newSurvey);
                console.log('Total surveys in memory:', surveys.length);

                // Respond with success
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Survey created successfully!', surveyId: newSurvey.id }));

            } catch (error) {
                console.error('Error processing survey creation request:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid survey data format.' }));
            }
        });
    }
    // Endpoint to Get Surveys
    else if (reqUrl.pathname === '/api/surveys' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(surveys));
    }
    // Endpoint for Data Ingestion (File Upload)
    else if (reqUrl.pathname === '/api/ingest' && req.method === 'POST') {
        const busboy = new Busboy({ headers: req.headers });
        const fields = {};
        const filePromises = [];

        busboy.on('field', (fieldname, val) => fields[fieldname] = val);
        busboy.on('file', (fieldname, file, filename) => {
            const chunks = [];
            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                filePromises.push({
                    fileName: filename,
                    buffer: Buffer.concat(chunks)
                });
            });
        });

        busboy.on('finish', async () => {
            if (filePromises.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'No files uploaded.' }));
            }

            const jobId = `job_${Date.now()}`;
            const newJob = {
                id: jobId,
                type: 'ingestion',
                source: filePromises.map(f => f.fileName).join(', '),
                model: fields.model,
                params: fields.params,
                status: 'processing',
                receivedAt: new Date().toISOString(),
            };
            jobs.push(newJob);
            console.log('New ingestion job started:', newJob);

            // Simulate processing
            setTimeout(() => {
                const job = jobs.find(j => j.id === jobId);
                if (job) {
                    job.status = 'completed';
                    console.log(`Job ${jobId} completed.`);
                }
            }, 5000);

            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Ingestion job started.', jobId: jobId }));
        });

        req.pipe(busboy);
    }
    // Endpoint for Data Analysis (Existing Data)
    else if (reqUrl.pathname === '/api/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { sourceId, model, params } = JSON.parse(body);
                const survey = surveys.find(s => s.id === sourceId);

                if (!survey) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Survey not found.' }));
                }

                const jobId = `job_${Date.now()}`;
                const newJob = {
                    id: jobId,
                    type: 'analysis',
                    source: `Survey: ${survey.title}`,
                    model: model,
                    params: params,
                    status: 'processing',
                    receivedAt: new Date().toISOString(),
                };
                jobs.push(newJob);
                console.log('New analysis job started:', newJob);

                // Simulate analysis
                setTimeout(() => {
                    const job = jobs.find(j => j.id === jobId);
                    if (job) {
                        job.status = 'completed';
                        console.log(`Job ${jobId} completed.`);
                    }
                }, 8000); // Longer delay for analysis

                res.writeHead(202, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Analysis job started.', jobId: jobId }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON.' }));
            }
        });
    }
    // Endpoint for AI Agent (Multiple Documents)
    else if (reqUrl.pathname === '/api/process-documents' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { files, prompt } = JSON.parse(body);

                if (!files || files.length === 0 || !prompt) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing files or prompt.' }));
                }

                // Construct the multi-part message for DeepSeek
                const messages = [
                    {
                        role: "user",
                        content: `DOCUMENT EXTRACTION TASK: ${prompt}`
                    }
                ];
                
                const attachments = files.map(file => ({
                    type: "image",
                    data: file.data,
                    mime_type: file.mimeType
                }));

                const deepseekRequestData = JSON.stringify({
                    model: DEEPSEEK_MODEL,
                    messages: messages,
                    attachments: attachments,
                    max_tokens: 4096,
                });

                const options = {
                    hostname: 'api.deepseek.com',
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    }
                };

                const deepseekReq = https.request(options, (deepseekRes) => {
                    let deepseekResBody = '';
                    deepseekRes.on('data', (chunk) => deepseekResBody += chunk);
                    deepseekRes.on('end', () => {
                        res.writeHead(deepseekRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(deepseekResBody);
                    });
                });

                deepseekReq.on('error', (e) => {
                    console.error('Error calling DeepSeek API:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to communicate with DeepSeek API.' }));
                });

                deepseekReq.write(deepseekRequestData);
                deepseekReq.end();

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON.' }));
            }
        });
    }
    // Endpoint for Interactive Assistant
    else if (reqUrl.pathname === '/api/assistant' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { userId, message } = JSON.parse(body);

                if (!userId || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing userId or message.' }));
                }

                // Retrieve or initialize chat history
                if (!chatHistories[userId]) {
                    chatHistories[userId] = [
                        { role: 'system', content: 'You are a helpful assistant for the African Development Models Initiative application. Your goal is to guide users on how to use the app. You know about the following pages: Home, About Us, Survey Forms, Data Ingestion & Analysis, Research Dashboard, and AI Agent. Be concise and helpful.' }
                    ];
                }
                chatHistories[userId].push({ role: 'user', content: message });

                const deepseekRequestData = JSON.stringify({
                    model: DEEPSEEK_MODEL,
                    messages: chatHistories[userId],
                    max_tokens: 250,
                });

                const options = {
                    hostname: 'api.deepseek.com',
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    }
                };

                const deepseekReq = https.request(options, (deepseekRes) => {
                    let deepseekResBody = '';
                    deepseekRes.on('data', (chunk) => deepseekResBody += chunk);
                    deepseekRes.on('end', () => {
                        try {
                            const result = JSON.parse(deepseekResBody);
                            const reply = result.choices[0].message.content;
                            
                            // Save assistant's reply to history
                            chatHistories[userId].push({ role: 'assistant', content: reply });

                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ reply: reply }));
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to parse DeepSeek response.' }));
                        }
                    });
                });

                deepseekReq.on('error', (e) => {
                    console.error('Error calling DeepSeek API:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to communicate with DeepSeek API.' }));
                });

                deepseekReq.write(deepseekRequestData);
                deepseekReq.end();

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON.' }));
            }
        });
    }
    // Endpoint for Research Assistant
    else if (reqUrl.pathname === '/api/research-assistant' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { message, contextId, userId = 'default_user' } = JSON.parse(body);

                if (!message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Message is required.' }));
                }

                let contextPrompt = "You are an expert research assistant. Your goal is to provide advice on survey design, question phrasing, and data analysis strategies. Be insightful and clear.";
                if (contextId) {
                    const survey = surveys.find(s => s.id === contextId);
                    if (survey) {
                        contextPrompt += `\n\nThe user has provided the following survey as context. Use it to inform your advice:\n${JSON.stringify(survey, null, 2)}`;
                    }
                }

                if (!researchChatHistories[userId]) {
                    researchChatHistories[userId] = [{ role: 'system', content: contextPrompt }];
                }
                researchChatHistories[userId].push({ role: 'user', content: message });

                const deepseekRequestData = JSON.stringify({
                    model: DEEPSEEK_MODEL,
                    messages: researchChatHistories[userId],
                    max_tokens: 500,
                });

                const options = {
                    hostname: 'api.deepseek.com',
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }
                };

                const deepseekReq = https.request(options, (deepseekRes) => {
                    let deepseekResBody = '';
                    deepseekRes.on('data', (chunk) => deepseekResBody += chunk);
                    deepseekRes.on('end', () => {
                        try {
                            const result = JSON.parse(deepseekResBody);
                            const reply = result.choices[0].message.content;
                            researchChatHistories[userId].push({ role: 'assistant', content: reply });
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ reply }));
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to parse DeepSeek response.' }));
                        }
                    });
                });
                deepseekReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to communicate with DeepSeek API.' }));
                });
                deepseekReq.write(deepseekRequestData);
                deepseekReq.end();

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON.' }));
            }
        });
    }
    // Fallback for other routes
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
