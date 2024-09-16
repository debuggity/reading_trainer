document.getElementById('startButton').addEventListener('click', startRound);
document.getElementById('finishButton').addEventListener('click', finishReading);
document.getElementById('submitAnswer').addEventListener('click', submitComprehensionAnswer);

let startTime;
let readingSpeeds = [];
let comprehensionAccuracy = [];
let currentTextIndex = -1;
let comprehensionData = []; // Initially empty, will be populated from the file

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

    const intervalId = setInterval(() => {
        if (wordIndex < words.length) {
            words[wordIndex] = `<span style="color: green;">${words[wordIndex]}</span>`;
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

    readingSpeeds.push(readingSpeedWPM);
    if (readingSpeeds.length > 10) {
        readingSpeeds.shift(); // Keep only the latest 10 readings
    }

    // Save reading speeds to localStorage
    localStorage.setItem('readingSpeeds', JSON.stringify(readingSpeeds));

    const averageSpeed = getAverageSpeed();
    document.getElementById('results').innerHTML = `Your reading speed: <strong>${readingSpeedWPM.toFixed(2)} words/minute</strong> (${readingSpeedWPS.toFixed(2)} words/second).<br>10-game weighted average: <strong>${averageSpeed.toFixed(2)} words/minute</strong>.`;

    document.getElementById('textPassage').style.display = 'none';
    document.getElementById('finishButton').style.display = 'none'; // Hide the finish button here
    showComprehensionQuestion();
}

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

    if (wordsInPassage.length === 0) {
        wordsInPassage.push(cleanWord(currentData.decoy)); // Fallback
    }

    let synonyms = [];
    let randomWord;
    let attempts = 0;

    do {
        if (attempts >= wordsInPassage.length) {
            console.log("No suitable words with synonyms found in the passage.");
            return; // Or handle this case as appropriate
        }

        randomWord = wordsInPassage[Math.floor(Math.random() * wordsInPassage.length)];
        const response = await generateSynonyms(randomWord);
        console.log(response.synonyms);
        
        synonyms = response.synonyms.filter(syn => syn !== randomWord && !wordsInPassage.includes(syn));
        attempts++;
    } while (synonyms.length < 4);

    const options = [randomWord, cleanWord(synonyms[0]), cleanWord(synonyms[1]), cleanWord(synonyms[2])];

    options.sort(() => Math.random() - 0.5); // Shuffle options

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

    // Load comprehension accuracy from localStorage
    const savedComprehensionAccuracy = localStorage.getItem('comprehensionAccuracy');
    if (savedComprehensionAccuracy) {
        comprehensionAccuracy = JSON.parse(savedComprehensionAccuracy);
    }
};
