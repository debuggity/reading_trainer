document.getElementById('startButton').addEventListener('click', startRound);
document.getElementById('finishButton').addEventListener('click', finishReading);
document.getElementById('submitAnswer').addEventListener('click', submitComprehensionAnswer);

let startTime;
let readingSpeeds = [];
let comprehensionAccuracy = [];
let currentTextIndex = -1;
let comprehensionData = []; // Initially empty, will be populated from the file
let totalGames = 0; // Total games played

// Initialize allReadingSpeeds
let allReadingSpeeds = [];


// Function to load the comprehension data from the text file
function loadComprehensionData() {
    return fetch('comprehensionData.txt') // Make sure the file is located in the same directory as the HTML file
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            // Normalize line endings to just '\n' to handle both Windows and Unix-style endings
            const normalizedText = text.replace(/\r\n/g, '\n').trim();

            // Split the text by two or more newlines to get each passage-decoy pair
            const entries = normalizedText.split(/\n{2,}/); // Handle multiple newlines

            comprehensionData = entries.map(entry => {
                // Trim each entry and split by the pipe '|'
                const parts = entry.split('|').map(part => part.trim());

                // Check if we have both a passage and a decoy
                if (parts.length === 2) {
                    return { passage: parts[0], decoy: parts[1] };
                } else {
                    console.error('Invalid data format:', entry);
                    return null;
                }
            }).filter(item => item !== null); // Filter out any invalid entries

            console.log("Loaded comprehension data:", comprehensionData);

            if (comprehensionData.length > 0) {
                shuffleArray(comprehensionData); // Shuffle the data after loading
            } else {
                console.error("No comprehension data loaded.");
            }
        })
        .catch(error => {
            console.error("Error loading comprehension data:", error);
        });
}

const stopWords = new Set([
    "the", "in", "of", "to", "and", "a", "an", "is", "it", "for", "on", "with", "as", "at", "this",
    "but", "by", "or", "from", "are", "that", "be", "was", "were", "if", "they", "will", "their",
    "he", "she", "have", "has", "had", "do", "does", "did", "you", "your", "we", "our", "us",
    // Existing words
    "her", "him", "its", "can", "could", "would", "should", "may", "might", "must", "about", "above",
    "after", "against", "along", "among", "around", "before", "below", "beneath", "beside", "between",
    "beyond", "during", "except", "inside", "into", "near", "outside", "over", "through", "throughout",
    "under", "until", "upon", "within", "without", "these", "those", "which", "what", "who", "whom",
    "whose", "why", "how", "where", "when", "all", "any", "both", "each", "few", "many", "most", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "one",
    "every", "theirs", "my", "mine", "yours", "his", "hers", "its", "ours", "yours", "theirs", "here",
    "there", "again", "further", "once", "then", "quite",
    // Add more stop words as needed
    "amongst", "around", "because", "been", "beforehand", "below", "besides", "beyond", "both", "brief",
    "else", "elsewhere", "enough", "etc", "even", "ever", "everywhere", "except", "few", "further",
    "hence", "hereafter", "hereby", "herein", "hereupon", "however", "indeed", "instead", "latter",
    "latterly", "less", "lest", "meanwhile", "moreover", "namely", "nearby", "neither", "nevertheless",
    "none", "nonetheless", "notwithstanding", "otherwise", "perhaps", "rather", "since", "someday",
    "sometimes", "somewhat", "somewhere", "soon", "thereafter", "thereby", "therefore", "therein",
    "thereupon", "though", "thus", "together", "towards", "unless", "unto", "upon", "usually", "whatever",
    "whenever", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "whither", "within",
    "without", "yet"
]);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

function startRound() {
    if (comprehensionData.length === 0) {
        alert("Data is still loading. Please wait a moment.");
        return;
    }

    // Increment the index to show the next passage
    currentTextIndex++;
    console.log(currentTextIndex);
    
    // Wrap around to the beginning of the data if we've reached the end
    if (currentTextIndex >= comprehensionData.length) {
        currentTextIndex = 0;
    }

    let textPassage = comprehensionData[currentTextIndex].passage;

    document.getElementById('textPassage').innerText = textPassage;
    document.getElementById('textPassage').style.display = 'block';
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('comprehensionQuestion').style.display = 'none';

    startTime = new Date();
    document.getElementById('finishButton').style.display = 'inline';
    highlightWordsAtReadingSpeed(textPassage.split(' '), getAverageSpeed());
}

function highlightWordsAtReadingSpeed(words, averageSpeedWPM) {
    const intervalTime = (60 / averageSpeedWPM) * 1000; // Time per word in milliseconds
    let wordIndex = 0;

    // Check if dark mode is enabled
    const isDarkMode = document.body.classList.contains('dark-mode');
    const highlightColor = isDarkMode ? '#1abc9c' : 'green'; // Use different colors for dark and light modes

    const intervalId = setInterval(() => {
        if (wordIndex < words.length) {
            words[wordIndex] = `<span style="color: ${highlightColor};">${words[wordIndex]}</span>`;
            document.getElementById('textPassage').innerHTML = words.join(' ');
            wordIndex++;
        } else {
            clearInterval(intervalId); // Stop the interval when all words are highlighted
        }
    }, intervalTime);
}

function finishReading() {
    const endTime = new Date();
    const readingTime = (endTime - startTime) / 1000; // in seconds
    const words = document.getElementById('textPassage').innerText.split(' ');
    const readingSpeedWPS = words.length / readingTime; // words per second
    const readingSpeedWPM = readingSpeedWPS * 60; // words per minute

    // Update limited readingSpeeds
    readingSpeeds.push(readingSpeedWPM);
    if (readingSpeeds.length > 10) {
        readingSpeeds.shift(); // Keep only the latest 10 readings
    }
    localStorage.setItem('readingSpeeds', JSON.stringify(readingSpeeds));

    // Update allReadingSpeeds
    allReadingSpeeds.push(readingSpeedWPM);
    localStorage.setItem('allReadingSpeeds', JSON.stringify(allReadingSpeeds));

    // Increment total games and save to localStorage
    totalGames++;
    localStorage.setItem('totalGames', totalGames);

    const averageSpeed = getAverageSpeed();
    document.getElementById('results').innerHTML = `Your reading speed: <strong>${readingSpeedWPM.toFixed(2)} words/minute</strong> (${readingSpeedWPS.toFixed(2)} words/second).<br>10-game weighted average: <strong>${averageSpeed.toFixed(2)} words/minute</strong>.`;

    document.getElementById('textPassage').style.display = 'none';
    document.getElementById('finishButton').style.display = 'none'; // Hide the finish button here

    showComprehensionQuestion();

    // Show the "View Your Stats" button after the test results
    const viewStatsButton = document.getElementById('viewStatsButton');
    viewStatsButton.style.display = 'inline-block';  // Make the button visible
}


// Add an event listener for the "View Your Stats" button
document.getElementById('viewStatsButton').addEventListener('click', function() {
    document.getElementById('statsModal').style.display = 'block';
    renderStats();  // Call the function to render stats
});

function getAverageSpeed() {
    console.log('Current reading speeds:', readingSpeeds); // Debugging line
    let totalSpeed = 0;

    readingSpeeds.forEach(speed => {
        totalSpeed += speed;
    });

    return readingSpeeds.length > 0 ? totalSpeed / readingSpeeds.length : 0;
}

function cleanWord(word) {
    return word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

async function generateSynonyms(word) {
    const synonyms = [];
    try {
        // Fetch synonyms
        const responseSynonyms = await fetch(`https://api.datamuse.com/words?rel_syn=${word}`);
        const dataSynonyms = await responseSynonyms.json();
        dataSynonyms.forEach(item => synonyms.push(item.word));

        return {
            synonyms
        };
    } catch (error) {
        console.error('Error fetching data from Datamuse:', error);
        return {
            synonyms
        };
    }
}
  
async function showComprehensionQuestion() {
    const currentData = comprehensionData[currentTextIndex];
    const wordsInPassage = currentData.passage.split(' ')
        .filter(word => !stopWords.has(cleanWord(word)))
        .map(cleanWord);

    // If the passage has no suitable words, use the decoy as fallback
    if (wordsInPassage.length === 0) {
        wordsInPassage.push(cleanWord(currentData.decoy));
    }

    let synonyms = [];
    let randomWord;
    let attempts = 0;

    do {
        if (attempts >= wordsInPassage.length) {
            console.log("No suitable words with synonyms found in the passage. Using the decoy and actual word.");

            // Fallback: Use the decoy and the actual word from the passage
            const fallbackOptions = [cleanWord(currentData.decoy), cleanWord(wordsInPassage[0])];
            displayComprehensionOptions(fallbackOptions);
            return; // Exit the loop and function after using the fallback
        }

        randomWord = wordsInPassage[Math.floor(Math.random() * wordsInPassage.length)];
        const response = await generateSynonyms(randomWord);
        console.log(response.synonyms);

        // Filter synonyms that are not the original word and are not already in the passage
        synonyms = response.synonyms.filter(syn => syn !== randomWord && !wordsInPassage.includes(syn));
        attempts++;
    } while (synonyms.length < 4);

    // Use the found synonyms or fallback options
    const options = [randomWord, cleanWord(synonyms[0]), cleanWord(synonyms[1]), cleanWord(synonyms[2])];
    options.sort(() => Math.random() - 0.5); // Shuffle options

    displayComprehensionOptions(options);
}

function displayComprehensionOptions(options) {
    const optionsContainer = document.getElementById('answerOptions');
    optionsContainer.innerHTML = '';

    // Add explanation text
    const instructionText = document.createElement('p');
    instructionText.textContent = "Pick the word that was in the sentence you just read.";
    optionsContainer.appendChild(instructionText);

    options.forEach((option, index) => {
        const optionInput = document.createElement('input');
        optionInput.type = 'radio';
        optionInput.name = 'comprehensionAnswer';
        optionInput.value = option;
        optionInput.id = 'option' + index;

        const optionLabel = document.createElement('label');
        optionLabel.className = 'answerLabel';
        optionLabel.htmlFor = optionInput.id;
        optionLabel.appendChild(document.createTextNode(option));

        optionsContainer.appendChild(optionInput);
        optionsContainer.appendChild(optionLabel);
    });

    document.getElementById('comprehensionQuestion').style.display = 'block';
}

// Add event listener for opening Stats modal
document.getElementById('openStats').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('statsModal').style.display = 'block';
    renderStats(); // Render the charts when the modal is opened
});

// Add event listener for closing Stats modal
document.getElementById('closeStats').addEventListener('click', function() {
    document.getElementById('statsModal').style.display = 'none';
});

function renderStats() {
    // Retrieve data from localStorage
    const readingSpeeds = JSON.parse(localStorage.getItem('readingSpeeds')) || [];
    const allReadingSpeeds = JSON.parse(localStorage.getItem('allReadingSpeeds')) || [];
    const comprehensionAccuracy = JSON.parse(localStorage.getItem('comprehensionAccuracy')) || [];
    
    // Display total games played
    document.getElementById('totalRounds').innerText = totalGames;
    
    // Calculate Best and Worst Reading Speed
    const bestSpeed = readingSpeeds.length > 0 ? Math.max(...readingSpeeds) : 0;
    const worstSpeed = readingSpeeds.length > 0 ? Math.min(...readingSpeeds) : 0;
    document.getElementById('bestSpeed').innerText = bestSpeed.toFixed(2);
    document.getElementById('worstSpeed').innerText = worstSpeed.toFixed(2);
    
    // Calculate Average Comprehension
    const averageComprehension = comprehensionAccuracy.length > 0 ? 
        ((comprehensionAccuracy.reduce((a, b) => a + b, 0) / comprehensionAccuracy.length) * 100).toFixed(2) : 0;
    document.getElementById('averageComprehension').innerText = averageComprehension;
    
    // Prepare data for WPM chart with round number as the x-axis
    const wpmData = readingSpeeds.map((speed, index) => ({
        x: index + 1,  // Round number
        y: speed       // WPM
    }));
    
    // Prepare data for Comprehension Accuracy chart
    const accuracyData = comprehensionAccuracy.map((accuracy, index) => ({
        x: index + 1,
        y: accuracy * 100 // Convert to percentage
    }));
    
    // Prepare data for Speed Distribution Chart using allReadingSpeeds
    const speedBuckets = {};
    allReadingSpeeds.forEach(speed => {
        const bucket = Math.floor(speed / 50) * 50; // e.g., 0-50, 51-100, etc.
        speedBuckets[bucket] = (speedBuckets[bucket] || 0) + 1;
    });
    const speedLabels = Object.keys(speedBuckets).sort((a, b) => a - b);
    const speedCounts = speedLabels.map(label => speedBuckets[label]);
    
    // Destroy existing charts if they exist to avoid duplication
    if (window.wpmChartInstance) {
        window.wpmChartInstance.destroy();
    }
    if (window.accuracyChartInstance) {
        window.accuracyChartInstance.destroy();
    }
    if (window.speedDistributionChartInstance) {
        window.speedDistributionChartInstance.destroy();
    }
    
    // Calculate the average WPM for the red dotted line
    const averageWPM = getAverageSpeed();
    
    // Render WPM Chart
    const wpmCtx = document.getElementById('wpmChart').getContext('2d');
    window.wpmChartInstance = new Chart(wpmCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'WPM',
                data: wpmData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#3498db',
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#2980b9'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Round'
                    },
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        beginAtZero: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Words Per Minute'
                    },
                    beginAtZero: false,
                    min: Math.min(...readingSpeeds, 0) - 10,
                    max: Math.max(...readingSpeeds, averageWPM) + 10,
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} WPM`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        avgWPMLine: {
                            type: 'line',
                            yMin: averageWPM,
                            yMax: averageWPM,
                            borderColor: 'rgba(52, 152, 219, 0.4)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                        }
                    }
                }
            }
        }
    });
    
    // Render Comprehension Accuracy Chart
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    window.accuracyChartInstance = new Chart(accuracyCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Comprehension Accuracy (%)',
                data: accuracyData,
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#e67e22',
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#d35400'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Round'
                    },
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        beginAtZero: true
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Comprehension Accuracy (%)'
                    },
                    beginAtZero: true,
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Render Speed Distribution Chart
    const speedCtx = document.getElementById('speedDistributionChart').getContext('2d');
    window.speedDistributionChartInstance = new Chart(speedCtx, {
        type: 'bar',
        data: {
            labels: speedLabels,
            datasets: [{
                label: '# of Rounds',
                data: speedCounts,
                backgroundColor: '#3498db', // Updated to match blue theme
                borderColor: '#2980b9',     // Updated border color to match blue theme
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'WPM Range'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Rounds'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} Rounds`;
                        }
                    }
                }
            }
        }
    });
    
    // Render Achievements
    renderAchievements();
}


function renderAchievements() {
    const achievementsContainer = document.getElementById('achievements');
    achievementsContainer.innerHTML = ''; // Clear existing badges
    
    const achievements = getAchievements();
    
    achievements.forEach(achievement => {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.title = achievement.description;
        
        const icon = document.createElement('i');
        icon.className = `fas ${achievement.icon}`;
        
        const label = document.createElement('span');
        label.textContent = achievement.name;
        
        badge.appendChild(icon);
        badge.appendChild(label);
        achievementsContainer.appendChild(badge);
        
        // Apply dark mode class if enabled
        if (document.body.classList.contains('dark-mode')) {
            badge.classList.add('dark-mode');
        }
    });
}


function getAchievements() {
    const achievements = [];
    const readingSpeeds = JSON.parse(localStorage.getItem('readingSpeeds')) || [];
    const totalGames = parseInt(localStorage.getItem('totalGames'), 10) || 0;
    
    // Example Achievements
    if (totalGames >= 10) {
        achievements.push({
            name: 'Reading Novice',
            description: 'Completed 10 reading rounds.',
            icon: 'fa-book-reader'
        });
    }
    if (totalGames >= 50) {
        achievements.push({
            name: 'Reading Enthusiast',
            description: 'Completed 50 reading rounds.',
            icon: 'fa-user-graduate'
        });
    }
    if (readingSpeeds.some(speed => speed >= 300)) {
        achievements.push({
            name: 'Speedster',
            description: 'Achieved a reading speed of 300 WPM or higher.',
            icon: 'fa-tachometer-alt-fast'
        });
    }
    if (readingSpeeds.length > 0) {
        const bestSpeed = Math.max(...readingSpeeds);
        if (bestSpeed >= 200) {
            achievements.push({
                name: 'Fast Reader',
                description: 'Best reading speed of 200 WPM or higher.',
                icon: 'fa-rocket'
            });
        }
    }
    
    // Add more achievements as desired
    
    return achievements;
}

// Export as CSV
document.getElementById('exportCSV').addEventListener('click', exportToCSV);

// Export as PDF
document.getElementById('exportPDF').addEventListener('click', exportToPDF);

function exportToCSV() {
    const readingSpeeds = JSON.parse(localStorage.getItem('readingSpeeds')) || [];
    const comprehensionAccuracy = JSON.parse(localStorage.getItem('comprehensionAccuracy')) || [];
    const totalGames = parseInt(localStorage.getItem('totalGames'), 10) || 0;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Total Games Played,' + totalGames + '\n';
    csvContent += 'Round,Reading Speed (WPM),Comprehension Accuracy (%)\n';
    
    readingSpeeds.forEach((speed, index) => {
        const accuracy = comprehensionAccuracy[index] ? (comprehensionAccuracy[index] * 100).toFixed(2) : 'N/A';
        csvContent += `${index + 1},${speed.toFixed(2)},${accuracy}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cozy_dash_reader_stats.csv');
    document.body.appendChild(link); // Required for Firefox
    
    link.click();
    document.body.removeChild(link);
}

function exportToPDF() {
    // Ensure you include jsPDF library in your HTML
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Cozy Dash Reader Stats', 20, 20);
    
    doc.setFontSize(12);
    const totalGames = parseInt(localStorage.getItem('totalGames'), 10) || 0;
    doc.text(`Total Games Played: ${totalGames}`, 20, 30);
    
    const readingSpeeds = JSON.parse(localStorage.getItem('readingSpeeds')) || [];
    const comprehensionAccuracy = JSON.parse(localStorage.getItem('comprehensionAccuracy')) || [];
    
    doc.text('Round | Reading Speed (WPM) | Comprehension Accuracy (%)', 20, 40);
    readingSpeeds.forEach((speed, index) => {
        const accuracy = comprehensionAccuracy[index] ? (comprehensionAccuracy[index] * 100).toFixed(2) : 'N/A';
        doc.text(`${index + 1} | ${speed.toFixed(2)} | ${accuracy}`, 20, 50 + index * 10);
    });
    
    doc.save('cozy_dash_reader_stats.pdf');
}

// Modify submitComprehensionAnswer to update stats
function submitComprehensionAnswer() {
    const selectedOption = document.querySelector('input[name="comprehensionAnswer"]:checked');
    const userAnswer = selectedOption ? cleanWord(selectedOption.value) : "";
    const wordsInPassage = comprehensionData[currentTextIndex].passage.split(' ')
        .map(cleanWord)
        .filter(word => !stopWords.has(word));

    const correct = wordsInPassage.includes(userAnswer);
    comprehensionAccuracy.push(correct ? 1 : 0);
    if (comprehensionAccuracy.length > 10) {
        comprehensionAccuracy.shift(); // Keep only the latest 10 accuracy records
    }

    // Save comprehension accuracy to localStorage
    localStorage.setItem('comprehensionAccuracy', JSON.stringify(comprehensionAccuracy));

    const averageAccuracy = comprehensionAccuracy.reduce((a, b) => a + b, 0) / comprehensionAccuracy.length;
    const readingSpeedWPM = readingSpeeds[readingSpeeds.length-1]; // words per minute
    const readingSpeedWPS = readingSpeedWPM / 60; // words per second

    const averageSpeed = getAverageSpeed();

    let resultsHTML = `Your reading speed: <strong>${readingSpeedWPM.toFixed(2)} words/minute</strong> (${readingSpeedWPS.toFixed(2)} words/second).<br>`;
    resultsHTML += `10-game average: <strong>${averageSpeed.toFixed(2)} words/minute</strong>.<br>`;
    resultsHTML += `10-game comprehension accuracy: <strong>${(averageAccuracy * 100).toFixed(2)}%</strong>.<br>`;
    
    // Add feedback about the last question
    resultsHTML += `Last question was <strong>${correct ? 'correct' : 'incorrect'}</strong>.`;

    document.getElementById('results').innerHTML = resultsHTML;
    document.getElementById('results').style.display = 'block';

    document.getElementById('textPassage').style.display = 'none';
    document.getElementById('finishButton').style.display = 'none'; // Hide the finish button here
    document.getElementById('comprehensionQuestion').style.display = 'none';
    document.getElementById('startButton').style.display = 'inline';
}

// Modal functionality for Features
document.getElementById('openFeatures').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('featuresModal').style.display = 'block';
});

document.getElementById('closeFeatures').addEventListener('click', function() {
    document.getElementById('featuresModal').style.display = 'none';
});

// Modal functionality for About
document.getElementById('openAbout').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('aboutModal').style.display = 'block';
});

document.getElementById('closeAbout').addEventListener('click', function() {
    document.getElementById('aboutModal').style.display = 'none';
});

// Close modals when clicking outside of them
window.onclick = function(event) {
    if (event.target == document.getElementById('featuresModal')) {
        document.getElementById('featuresModal').style.display = 'none';
    }
    if (event.target == document.getElementById('aboutModal')) {
        document.getElementById('aboutModal').style.display = 'none';
    }
    if (event.target == document.getElementById('statsModal')) { // Add this condition
        document.getElementById('statsModal').style.display = 'none';
    }
}

document.getElementById('settingsButton').addEventListener('click', function() {
    document.getElementById('settingsPopup').style.display = 'block';
});

document.getElementsByClassName('close')[0].addEventListener('click', function() {
    document.getElementById('settingsPopup').style.display = 'none';
});

// Update the sample text font size as the range input changes
document.getElementById('fontSize').addEventListener('input', function() {
    const fontSize = document.getElementById('fontSize').value;
    document.getElementById('sampleText').style.fontSize = fontSize + 'px';
    
    // Save the font size to localStorage
    localStorage.setItem('fontSize', fontSize);
});

document.getElementById('applySettings').addEventListener('click', function() {
    const fontSize = document.getElementById('fontSize').value;
    
    // Apply the font size to the text passage
    document.getElementById('textPassage').style.fontSize = fontSize + 'px';
    
    // Save the font size to localStorage
    localStorage.setItem('fontSize', fontSize);
    
    // Hide the settings popup after applying the settings
    document.getElementById('settingsPopup').style.display = 'none';
});

document.getElementById('closeSettings').addEventListener('click', function() {
    document.getElementById('settingsPopup').style.display = 'none';
});

// Share Button Functionality
document.getElementById('shareButton').addEventListener('click', function() {
    const url = window.location.href; // Get the current URL
    navigator.clipboard.writeText(url).then(() => {
        const notification = document.getElementById('copyNotification');
        notification.classList.add('show'); // Show the notification

        // Hide the notification after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }).catch(err => {
        console.error('Error copying URL:', err);
    });
});

// Dark Mode Toggle Functionality
document.getElementById('darkModeToggle').addEventListener('change', function() {
    const isChecked = this.checked;
    toggleDarkMode(isChecked);
    
    // Save the user's preference to localStorage
    localStorage.setItem('darkMode', isChecked ? 'enabled' : 'disabled');
});

// Function to toggle dark mode on or off
function toggleDarkMode(enableDarkMode) {
    const elementsToToggle = document.querySelectorAll('body, .container, button, #textPassage, #results, .modal-content, footer, #comprehensionQuestion, .answerLabel');

    elementsToToggle.forEach(element => {
        if (enableDarkMode) {
            element.classList.add('dark-mode');
        } else {
            element.classList.remove('dark-mode');
        }
    });
}

// Add event listener for the Reset Data button
document.getElementById('resetData').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset all your data? This action cannot be undone.")) {
        // Clear all relevant localStorage items
        localStorage.removeItem('readingSpeeds');
        localStorage.removeItem('allReadingSpeeds');
        localStorage.removeItem('comprehensionAccuracy');
        localStorage.removeItem('totalGames');
        
        // Reset variables
        readingSpeeds = [];
        allReadingSpeeds = [];
        comprehensionAccuracy = [];
        totalGames = 0;
        
        // Update the UI
        renderStats();
        
        alert("All your data has been reset.");
    }
});


window.onload = function() {
    loadComprehensionData(); // Load comprehension data

    // Load dark mode setting
    const darkModeSetting = localStorage.getItem('darkMode');
    if (darkModeSetting === 'enabled') {
        document.getElementById('darkModeToggle').checked = true;
        toggleDarkMode(true);
    }

    // Load font size setting
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.getElementById('textPassage').style.fontSize = savedFontSize + 'px';
        document.getElementById('fontSize').value = savedFontSize;
        document.getElementById('sampleText').style.fontSize = savedFontSize + 'px';
    }

    // Load reading speeds from localStorage
    const savedReadingSpeeds = localStorage.getItem('readingSpeeds');
    if (savedReadingSpeeds) {
        readingSpeeds = JSON.parse(savedReadingSpeeds);
    }

    // Load allReadingSpeeds from localStorage
    const savedAllReadingSpeeds = localStorage.getItem('allReadingSpeeds');
    if (savedAllReadingSpeeds) {
        allReadingSpeeds = JSON.parse(savedAllReadingSpeeds);
    }

    // Load comprehension accuracy from localStorage
    const savedComprehensionAccuracy = localStorage.getItem('comprehensionAccuracy');
    if (savedComprehensionAccuracy) {
        comprehensionAccuracy = JSON.parse(savedComprehensionAccuracy);
    }

    // Load total games played from localStorage
    const savedTotalGames = localStorage.getItem('totalGames');
    if (savedTotalGames) {
        totalGames = parseInt(savedTotalGames, 10);
    }
};
