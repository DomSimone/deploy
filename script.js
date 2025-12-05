document.addEventListener('DOMContentLoaded', () => {

    // --- Research Themes Data Structure ---
    const RESEARCH_THEMES = {
        "demographics_social": {
            name: "Demographics & Social Dynamics",
            subTopics: [
                "Population Trends",
                "Diversity & Inclusion",
                "Family & Household Structures",
                "Cultural & Lifestyle Trends"
            ]
        },
        "economic_livelihoods": {
            name: "Economic Development & Livelihoods",
            subTopics: [
                "Income & Poverty",
                "Employment & Labor Market",
                "Sectoral Analysis"
            ]
        },
        "governance_civic": {
            name: "Governance, Civic Engagement & Public Services",
            subTopics: [
                "Political & Civic Participation",
                "Community & Public Services"
            ]
        },
        "urbanization_quality": {
            name: "Urbanization & Quality of Life",
            subTopics: [
                "Urban Growth & Planning",
                "Safety & Security",
                "Housing & Infrastructure"
            ]
        },
        "human_capital_wellness": {
            name: "Human Capital & Well-being",
            subTopics: [
                "Education & Social Mobility",
                "Health & Wellness"
            ]
        }
    };

    // --- Geographic Data Structure ---
    const GEOGRAPHIC_FOCUS = {
        "Africa (Continental)": [
            "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde (Cape Verde)",
            "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo, Democratic Republic of the (DRC)",
            "Congo, Republic of the (Congo-Brazzaville)", "Côte d'Ivoire (Ivory Coast)", "Djibouti", "Egypt",
            "Equatorial Guinea", "Eritrea", "Eswatini (formerly Swaziland)", "Ethiopia", "Gabon", "Gambia",
            "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar",
            "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
            "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa",
            "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
        ],
        "Northern Africa": [
            "Algeria", "Egypt", "Libya", "Mauritania", "Morocco",
            "Sahrawi Arab Democratic Republic", "Sudan", "Tunisia"
        ],
        "Western Africa": [
            "Benin", "Burkina Faso", "Cabo Verde (Cape Verde)", "Côte d'Ivoire",
            "The Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Liberia", "Mali",
            "Niger", "Nigeria", "Senegal", "Sierra Leone", "Togo"
        ],
        "Central Africa": [
            "Burundi", "Cameroon", "Central African Republic", "Chad",
            "The Congo (Republic of the Congo)", "Democratic Republic of the Congo",
            "Equatorial Guinea", "Gabon", "São Tomé and Príncipe"
        ],
        "Eastern Africa": [
            "Comoros", "Djibouti", "Eritrea", "Ethiopia", "Kenya", "Madagascar",
            "Mauritius", "Rwanda", "Seychelles", "Somalia", "South Sudan",
            "Sudan", "Tanzania", "Uganda"
        ],
        "Southern Africa": [
            "Angola", "Botswana", "Eswatini (formerly Swaziland)", "Lesotho",
            "Malawi", "Mozambique", "Namibia", "South Africa", "Zambia", "Zimbabwe"
        ]
    };

    // --- Authentication Logic ---
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                const response = await fetch('http://localhost:3000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Sign up successful! Please log in.');
                    window.location.href = 'login.html';
                } else {
                    alert(`Sign up failed: ${result.error}`);
                }
            } catch (error) {
                alert('An error occurred during sign up.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('userName', result.name);
                    alert('Login successful! Redirecting to the main application.');
                    window.location.href = 'index.html';
                } else {
                    alert(`Login failed: ${result.error}`);
                }
            } catch (error) {
                alert('An error occurred during login.');
            }
        });
    }

    // --- Interactive Assistant Logic ---
    const assistantApp = document.getElementById('interactive-assistant');
    if (assistantApp) {
        const chatWindow = document.getElementById('chat-window');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat-btn');
        
        // In a real app, this would come from a login system.
        const USER_ID = "user_12345"; 

        const addMessage = (sender, message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message', `${sender}-message`);
            messageElement.textContent = message;
            chatWindow.appendChild(messageElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        };

        const handleSendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            addMessage('user', message);
            chatInput.value = '';
            chatInput.disabled = true;
            sendChatBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:3000/api/assistant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: USER_ID, message: message }),
                });

                const result = await response.json();

                if (response.ok) {
                    addMessage('assistant', result.reply);
                } else {
                    addMessage('assistant', `Error: ${result.error}`);
                }
            } catch (error) {
                addMessage('assistant', "Sorry, I couldn't connect to the server.");
                console.error("Assistant Error:", error);
            } finally {
                chatInput.disabled = false;
                sendChatBtn.disabled = false;
                chatInput.focus();
            }
        };

        sendChatBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });

        addMessage('assistant', 'Hello! How can I help you navigate the application today?');
    }

    // --- AI Agent Logic ---
    const aiAgentDocsApp = document.getElementById('ai-agent-docs');
    if (aiAgentDocsApp) {
        const AI_BACKEND_ENDPOINT = "http://localhost:3000/api/process-documents"; // Note the plural
        const documentUpload = aiAgentDocsApp.querySelector('#documentUpload');
        const uploadedFilesList = aiAgentDocsApp.querySelector('#uploadedFilesList');
        const extractionPrompt = aiAgentDocsApp.querySelector('#extractionPrompt');
        const processDocumentsBtn = aiAgentDocsApp.querySelector('#processDocumentsBtn');
        const aiOutput = aiAgentDocsApp.querySelector('#aiOutput');
        const downloadCsvBtn = aiAgentDocsApp.querySelector('#downloadCsvBtn');
        const downloadJsonBtn = aiAgentDocsApp.querySelector('#downloadJsonBtn');

        const fileToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                data: reader.result.split(',')[1]
            });
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });

        const updateFileList = () => {
            uploadedFilesList.innerHTML = '';
            if (documentUpload.files.length === 0) {
                uploadedFilesList.innerHTML = '<li>No files selected.</li>';
            } else {
                for (const file of documentUpload.files) {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                    uploadedFilesList.appendChild(listItem);
                }
            }
        };

        documentUpload.addEventListener('change', updateFileList);

        processDocumentsBtn.addEventListener('click', async () => {
            const documents = documentUpload.files;
            const prompt = extractionPrompt.value;

            if (documents.length === 0) {
                alert('Please upload at least one document.');
                return;
            }
            if (documents.length > 20) {
                alert('You can upload a maximum of 20 documents at a time.');
                return;
            }
            if (!prompt.trim()) {
                alert('Please provide an extraction prompt.');
                return;
            }

            aiOutput.textContent = `Processing ${documents.length} document(s) with AI...`;
            downloadCsvBtn.disabled = true;
            downloadJsonBtn.disabled = true;
            processDocumentsBtn.disabled = true;

            try {
                const filePromises = Array.from(documents).map(fileToBase64);
                const encodedFiles = await Promise.all(filePromises);

                const response = await fetch(AI_BACKEND_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: encodedFiles, prompt: prompt }),
                });

                const result = await response.json();

                if (!response.ok) {
                    const errorMessage = result.error ? (result.error.message || JSON.stringify(result.error)) : `HTTP error! status: ${response.status}`;
                    throw new Error(errorMessage);
                }
                
                const extractedData = result.choices[0].message.content.trim();
                aiOutput.textContent = extractedData;
                
                if (extractedData) {
                    downloadCsvBtn.disabled = false;
                    downloadJsonBtn.disabled = false;
                }

            } catch (error) {
                aiOutput.textContent = `Error during AI processing: ${error.message}. Make sure the backend server is running. Check console for details.`;
                console.error('AI Agent Error:', error);
            } finally {
                processDocumentsBtn.disabled = false;
            }
        });
    }

    // --- Research Dashboard Logic ---
    const researchDashboard = document.getElementById('research-dashboard');
    if (researchDashboard) {
        const addWidgetBtn = document.getElementById('addWidgetBtn');
        const dashboardGrid = document.getElementById('dashboard-grid');

        const addWidget = (type) => {
            const widget = document.createElement('div');
            widget.className = 'widget';
            widget.innerHTML = `<h3>${type}</h3><p>Data for ${type}.</p><button class="remove-widget">&times;</button>`;
            dashboardGrid.appendChild(widget);
        };

        addWidgetBtn.addEventListener('click', () => addWidget('New Widget'));
        dashboardGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-widget')) {
                e.target.closest('.widget').remove();
            }
        });

        // Initialize charts with responsive options
        const barChartCtx = document.getElementById('barChart')?.getContext('2d');
        if (barChartCtx) {
            new Chart(barChartCtx, {
                type: 'bar',
                data: {
                    labels: ['Option A', 'Option B', 'Option C', 'Option D'],
                    datasets: [{
                        label: 'Responses',
                        data: [12, 19, 3, 5],
                        backgroundColor: [
                            'rgba(40, 122, 20, 0.6)',
                            'rgba(60, 179, 113, 0.6)',
                            'rgba(144, 238, 144, 0.6)',
                            'rgba(173, 216, 230, 0.6)'
                        ],
                        borderColor: [
                            'rgba(40, 122, 20, 1)',
                            'rgba(60, 179, 113, 1)',
                            'rgba(144, 238, 144, 1)',
                            'rgba(173, 216, 230, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow chart to fill container
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        title: {
                            display: false, // Title is in h3
                        }
                    }
                }
            });
        }

        const lineChartCtx = document.getElementById('lineChart')?.getContext('2d');
        if (lineChartCtx) {
            new Chart(lineChartCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Data Trend',
                        data: [65, 59, 80, 81, 56, 55],
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow chart to fill container
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        title: {
                            display: false, // Title is in h3
                        }
                    }
                }
            });
        }
    }

    // --- Interactive Research Assistant Logic ---
    const researchAssistantApp = document.getElementById('interactive-research-assistant');
    if (researchAssistantApp) {
        const chatWindow = document.getElementById('research-chat-window');
        const chatInput = document.getElementById('research-chat-input');
        const sendBtn = document.getElementById('send-research-chat-btn');
        const contextSelect = document.getElementById('research-context-select');

        const addMessage = (sender, message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message', `${sender}-message`);
            messageElement.textContent = message;
            chatWindow.appendChild(messageElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        };

        const fetchSurveys = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/surveys');
                const surveys = await response.json();
                if (response.ok) {
                    surveys.forEach(survey => {
                        const option = document.createElement('option');
                        option.value = survey.id;
                        option.textContent = survey.title;
                        contextSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch surveys:', error);
            }
        };

        const handleSendMessage = async () => {
            const message = chatInput.value.trim();
            const contextId = contextSelect.value;
            if (!message) return;

            addMessage('user', message);
            chatInput.value = '';

            try {
                const response = await fetch('http://localhost:3000/api/research-assistant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, contextId }),
                });
                const result = await response.json();
                addMessage('assistant', result.reply);
            } catch (error) {
                addMessage('assistant', 'Sorry, there was an error connecting to the server.');
            }
        };

        sendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, new line on Shift+Enter
                e.preventDefault(); // Prevent default Enter behavior (new line)
                handleSendMessage();
            }
        });

        addMessage('assistant', 'Hello! Select a survey context (optional) and ask me for research advice.');
        fetchSurveys();
    }

    // --- Survey Creation Logic (now part of Research Design & Management) ---
    const surveyCreationForm = document.getElementById('surveyCreationForm');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const surveyQuestionsContainer = document.getElementById('surveyQuestionsContainer');
    const enableUssd = document.getElementById('enableUssd');
    const ussdOptions = document.getElementById('ussdOptions');
    const ussdNumberInput = document.getElementById('ussdNumber');
    const ussdStringPreview = document.getElementById('ussdStringPreview');

    let questionCounter = 0;

    if (surveyCreationForm) {
        // Research Categorization elements
        const researchThemeSelect = document.getElementById('researchTheme');
        const subTopicGroup = document.getElementById('subTopicGroup');
        const researchSubTopicSelect = document.getElementById('researchSubTopic');
        const surveyVisibilityPublic = document.getElementById('visibilityPublic');
        const surveyVisibilityPrivate = document.getElementById('visibilityPrivate');
        const geoRegionSelect = document.getElementById('geoRegion');
        const geoCountryGroup = document.getElementById('geoCountryGroup');
        const geoCountrySelect = document.getElementById('geoCountry');
        const multiSelectHeader = document.getElementById('multiSelectHeader');
        const multiSelectDropdown = document.getElementById('multiSelectDropdown');

        // Populate sub-topics based on selected theme
        researchThemeSelect.addEventListener('change', () => {
            const selectedThemeKey = researchThemeSelect.value;
            researchSubTopicSelect.innerHTML = '<option value="">Select a Sub-Topic</option>'; // Clear previous options
            if (selectedThemeKey && RESEARCH_THEMES[selectedThemeKey]) {
                RESEARCH_THEMES[selectedThemeKey].subTopics.forEach(subTopic => {
                    const option = document.createElement('option');
                    option.value = subTopic;
                    option.textContent = subTopic;
                    researchSubTopicSelect.appendChild(option);
                });
                subTopicGroup.style.display = 'block';
            } else {
                subTopicGroup.style.display = 'none';
            }
        });

        // Populate countries based on selected region
        geoRegionSelect.addEventListener('change', () => {
            const selectedRegion = geoRegionSelect.value;
            geoCountrySelect.innerHTML = '<option value="">Select a Country</option>'; // Clear previous options
            if (selectedRegion && GEOGRAPHIC_FOCUS[selectedRegion]) {
                GEOGRAPHIC_FOCUS[selectedRegion].forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    geoCountrySelect.appendChild(option);
                });
                geoCountryGroup.style.display = 'block';
            } else {
                geoCountryGroup.style.display = 'none';
            }
        });

        // Populate and handle custom multi-select dropdown
        const allCountries = GEOGRAPHIC_FOCUS["Africa (Continental)"];
        allCountries.forEach(country => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = country;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(country));
            multiSelectDropdown.appendChild(label);
        });

        multiSelectHeader.addEventListener('click', () => {
            multiSelectDropdown.classList.toggle('show');
        });

        multiSelectDropdown.addEventListener('change', () => {
            const selectedCount = multiSelectDropdown.querySelectorAll('input[type="checkbox"]:checked').length;
            multiSelectHeader.textContent = selectedCount > 0 ? `${selectedCount} countries selected` : 'Select Countries...';
        });

        window.addEventListener('click', (e) => {
            if (!multiSelectHeader.contains(e.target) && !multiSelectDropdown.contains(e.target)) {
                multiSelectDropdown.classList.remove('show');
            }
        });


        const generateQuestionHtml = (id) => `
            <div class="question-item" data-question-id="${id}">
                <h4>Question ${id + 1}</h4>
                <div class="form-group">
                    <label for="questionText_${id}">Question Text:</label>
                    <input type="text" id="questionText_${id}" name="questionText_${id}" required>
                </div>
                <div class="form-group">
                    <label for="answerType_${id}">Answer Type:</label>
                    <select id="answerType_${id}" name="answerType_${id}" class="answer-type-select">
                        <option value="text">Text Input</option>
                        <option value="number">Number Input</option>
                        <option value="single-choice">Single Choice</option>
                        <option value="multiple-choice">Multiple Choice</option>
                    </select>
                </div>
                <div class="choice-options" style="display: none;">
                    <h5>Choices</h5>
                    <div class="choices-container" id="choicesContainer_${id}">
                        <!-- Dynamic choices will be added here -->
                    </div>
                    <button type="button" class="add-choice-btn btn">Add Choice</button>
                </div>
                <button type="button" class="remove-question-btn btn secondary-btn">Remove Question</button>
            </div>
        `;

        const generateChoiceHtml = (questionId, choiceId) => `
            <div class="form-group choice-item" data-choice-id="${choiceId}">
                <input type="text" name="question_${questionId}_choice_${choiceId}" placeholder="Choice Text" required>
                <button type="button" class="remove-choice-btn btn secondary-btn">X</button>
            </div>
        `;

        const updateUssdPreview = () => {
            let ussdString = `*${ussdNumberInput.value.replace(/\D/g, '')}*`; // Sanitize USSD number
            const surveyTitle = document.getElementById('surveyTitle').value || 'New Survey';
            ussdString += encodeURIComponent(surveyTitle.substring(0, 10)); // Shorten title for USSD

            const questions = surveyQuestionsContainer.querySelectorAll('.question-item');
            questions.forEach((q, index) => {
                const questionText = q.querySelector('input[type="text"]').value;
                const answerType = q.querySelector('.answer-type-select').value;
                
                if (questionText) {
                    ussdString += `*Q${index + 1}:${encodeURIComponent(questionText.substring(0, 15))}`; // Shorten question
                    if (answerType === 'single-choice' || answerType === 'multiple-choice') {
                        const choices = q.querySelectorAll('.choices-container input[type="text"]');
                        choices.forEach((choice, cIndex) => {
                            if (choice.value) {
                                ussdString += `/${encodeURIComponent(choice.value.substring(0, 10))}`; // Shorten choice
                            }
                        });
                    }
                }
            });
            ussdString += `#`;
            ussdStringPreview.textContent = ussdString;
        };

        addQuestionBtn.addEventListener('click', () => {
            const newQuestionDiv = document.createElement('div');
            newQuestionDiv.innerHTML = generateQuestionHtml(questionCounter);
            surveyQuestionsContainer.appendChild(newQuestionDiv.firstElementChild);
            questionCounter++;
            updateUssdPreview();
        });

        surveyQuestionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-question-btn')) {
                e.target.closest('.question-item').remove();
                updateUssdPreview();
            }
            if (e.target.classList.contains('add-choice-btn')) {
                const questionItem = e.target.closest('.question-item');
                const questionId = questionItem.dataset.questionId;
                const choicesContainer = questionItem.querySelector('.choices-container');
                let choiceCounter = choicesContainer.children.length;
                const newChoiceDiv = document.createElement('div');
                newChoiceDiv.innerHTML = generateChoiceHtml(questionId, choiceCounter);
                choicesContainer.appendChild(newChoiceDiv.firstElementChild);
                updateUssdPreview();
            }
            if (e.target.classList.contains('remove-choice-btn')) {
                e.target.closest('.choice-item').remove();
                updateUssdPreview();
            }
        });

        surveyQuestionsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('answer-type-select')) {
                const questionItem = e.target.closest('.question-item');
                const choiceOptionsDiv = questionItem.querySelector('.choice-options');
                if (e.target.value === 'single-choice' || e.target.value === 'multiple-choice') {
                    choiceOptionsDiv.style.display = 'block';
                } else {
                    choiceOptionsDiv.style.display = 'none';
                }
                updateUssdPreview();
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                updateUssdPreview();
            }
        });

        surveyQuestionsContainer.addEventListener('keyup', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                updateUssdPreview();
            }
        });

        enableUssd.addEventListener('change', () => {
            ussdOptions.style.display = enableUssd.checked ? 'block' : 'none';
            updateUssdPreview();
        });

        ussdNumberInput.addEventListener('keyup', updateUssdPreview);
        document.getElementById('surveyTitle').addEventListener('keyup', updateUssdPreview);


        surveyCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const surveyTitle = document.getElementById('surveyTitle').value;
            const goLiveDateTime = document.getElementById('goLiveDateTime').value;
            const stopDateTime = document.getElementById('stopDateTime').value;
            const enableUssdChecked = enableUssd.checked;
            const ussdNumber = ussdNumberInput.value;
            const selectedTheme = researchThemeSelect.value;
            const selectedSubTopic = researchSubTopicSelect.value;
            const surveyVisibility = document.querySelector('input[name="surveyVisibility"]:checked').value;
            const selectedRegion = geoRegionSelect.value;
            const selectedCountry = geoCountrySelect.value;
            const selectedSpecificCountries = Array.from(multiSelectDropdown.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);


            const questions = [];
            surveyQuestionsContainer.querySelectorAll('.question-item').forEach((qItem, index) => {
                const questionText = qItem.querySelector(`input[name="questionText_${qItem.dataset.questionId}"]`).value;
                const answerType = qItem.querySelector(`.answer-type-select`).value;
                const choices = [];

                if (answerType === 'single-choice' || answerType === 'multiple-choice') {
                    qItem.querySelectorAll('.choices-container input[type="text"]').forEach(choiceInput => {
                        if (choiceInput.value) {
                            choices.push(choiceInput.value);
                        }
                    });
                }

                questions.push({
                    id: index + 1,
                    text: questionText,
                    type: answerType,
                    choices: choices
                });
            });

            const surveyData = {
                title: surveyTitle,
                goLive: goLiveDateTime,
                stopLive: stopDateTime,
                researchTheme: selectedTheme, // Add selected theme
                researchSubTopic: selectedSubTopic, // Add selected sub-topic
                geographicFocus: {
                    region: selectedRegion,
                    country: selectedCountry,
                    specificCountries: selectedSpecificCountries
                },
                visibility: surveyVisibility, // Add visibility
                questions: questions,
                ussd: {
                    enabled: enableUssdChecked,
                    number: ussdNumber,
                    ussdString: ussdStringPreview.textContent // Get the generated string
                }
            };

            console.log('Survey Data to be sent:', surveyData);

            try {
                const response = await fetch("http://localhost:3000/api/create-survey", { // New endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(surveyData),
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Survey created successfully!');
                    console.log('Backend response:', result);
                    surveyCreationForm.reset(); // Clear form
                    surveyQuestionsContainer.innerHTML = ''; // Clear questions
                    questionCounter = 0;
                    ussdOptions.style.display = 'none';
                    ussdStringPreview.textContent = '';
                    subTopicGroup.style.display = 'none'; // Hide sub-topic dropdown
                    geoCountryGroup.style.display = 'none'; // Hide country dropdown
                    multiSelectHeader.textContent = 'Select Countries...';
                } else {
                    alert(`Failed to create survey: ${result.error || response.statusText}`);
                    console.error('Backend error:', result);
                }
            } catch (error) {
                alert('An error occurred while trying to create the survey.');
                console.error('Frontend error during survey creation:', error);
            }
        });
    }

    // --- Data Ingestion & Analysis Logic ---
    const dataIngestionApp = document.getElementById('data-ingestion-app');
    if (dataIngestionApp) {
        const sourceFileUpload = document.getElementById('sourceFileUpload');
        const sourceExistingData = document.getElementById('sourceExistingData');
        const fileUploadSection = document.getElementById('fileUploadSection');
        const existingDataSection = document.getElementById('existingDataSection');
        
        const dropZone = document.getElementById('dropZone');
        const browseBtn = document.getElementById('browseBtn');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const startIngestionBtn = document.getElementById('startIngestionBtn');
        const processingLogs = document.getElementById('processingLogs');
        const ingestionHistoryTable = document.getElementById('ingestionHistoryTable').querySelector('tbody');

        let filesToIngest = [];

        // --- Functions for Data Ingestion ---
        const handleFiles = (files) => {
            for (const file of files) {
                if (!filesToIngest.some(f => f.name === file.name)) {
                    filesToIngest.push(file);
                    const listItem = document.createElement('li');
                    listItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                    fileList.appendChild(listItem);
                }
            }
        };

        const log = (message) => {
            processingLogs.textContent += `\n[${new Date().toLocaleTimeString()}] ${message}`;
            processingLogs.scrollTop = processingLogs.scrollHeight;
        };

        const addHistoryEntry = (sourceName, model, status) => {
            const row = ingestionHistoryTable.insertRow(0);
            row.innerHTML = `
                <td>${sourceName}</td>
                <td>${model}</td>
                <td><span class="status-${status.toLowerCase()}">${status}</span></td>
                <td>${new Date().toLocaleString()}</td>
                <td><button class="btn secondary-btn">View Results</button></td>
            `;
        };

        // --- Event Listeners for Data Source ---
        sourceFileUpload.addEventListener('change', () => {
            fileUploadSection.style.display = 'block';
            existingDataSection.style.display = 'none';
        });

        sourceExistingData.addEventListener('change', () => {
            fileUploadSection.style.display = 'none';
            existingDataSection.style.display = 'block';
            fetchAndPopulateSurveys();
        });

        const fetchAndPopulateSurveys = async () => {
            try {
                log('Fetching available surveys...');
                const response = await fetch('http://localhost:3000/api/surveys');
                const surveys = await response.json();

                if (response.ok) {
                    existingDataSelect.innerHTML = '<option value="">Select a survey</option>';
                    surveys.forEach(survey => {
                        const option = document.createElement('option');
                        option.value = survey.id;
                        option.textContent = `${survey.title} (Created: ${new Date(survey.createdAt).toLocaleDateString()})`;
                        existingDataSelect.appendChild(option);
                    });
                    log('Successfully loaded surveys.');
                } else {
                    log(`Error loading surveys: ${surings.error}`);
                    existingDataSelect.innerHTML = '<option value="">Could not load surveys</option>';
                }
            } catch (error) {
                log('Fatal error connecting to backend to fetch surveys.');
                console.error('Fetch Surveys Error:', error);
            }
        };

        // --- Event Listeners for File Upload ---
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));

        // --- Event Listener for Starting Job ---
        startIngestionBtn.addEventListener('click', async () => {
            const dataSource = document.querySelector('input[name="dataSource"]:checked').value;
            const model = document.getElementById('modelSelect').value;
            const params = document.getElementById('modelParams').value;
            let jobData;
            let sourceName;

            if (dataSource === 'file') {
                if (filesToIngest.length === 0) {
                    alert('Please select files to process.');
                    return;
                }
                sourceName = filesToIngest.map(f => f.name).join(', ');
                log(`Starting job for ${filesToIngest.length} file(s) with model '${model}'...`);

                // For file uploads, we use FormData
                const formData = new FormData();
                filesToIngest.forEach(file => formData.append('files', file));
                formData.append('model', model);
                formData.append('params', params);
                jobData = formData;

            } else { // 'existing'
                const surveyId = existingDataSelect.value;
                if (!surveyId) {
                    alert('Please select a survey to analyze.');
                    return;
                }
                sourceName = `Survey: ${existingDataSelect.options[existingDataSelect.selectedIndex].text}`;
                log(`Starting analysis job for survey '${sourceName}' with model '${model}'...`);

                // For existing data, we send JSON
                jobData = JSON.stringify({
                    dataSource: 'survey',
                    sourceId: surveyId,
                    model: model,
                    params: params
                });
            }

            startIngestionBtn.disabled = true;

            try {
                const endpoint = dataSource === 'file' ? 'http://localhost:3000/api/ingest' : 'http://localhost:3000/api/analyze';
                const fetchOptions = {
                    method: 'POST',
                    body: jobData,
                };
                // For JSON, we need to set the Content-Type header
                if (dataSource === 'existing') {
                    fetchOptions.headers = { 'Content-Type': 'application/json' };
                }

                const response = await fetch(endpoint, fetchOptions);
                const result = await response.json();

                if (response.ok) {
                    log(`SUCCESS: Job started. Job ID: ${result.jobId}`);
                    addHistoryEntry(sourceName, model, 'Started');
                } else {
                    log(`ERROR: Failed to start job. ${result.error}`);
                    addHistoryEntry(sourceName, model, 'Failed');
                }
            } catch (error) {
                log(`FATAL: Could not connect to backend to start job for ${sourceName}.`);
                addHistoryEntry(sourceName, model, 'Failed');
                console.error('Job Start Error:', error);
            }

            // Reset UI
            startIngestionBtn.disabled = false;
            filesToIngest = [];
            fileList.innerHTML = '';
        });
    }
});
