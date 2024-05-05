let wordPairs = [];
let currentQuestionIndex = 0;

// Fetch word pairs from the server
function fetchWordPairs() {
    fetch('/words?priority=high')
        .then(response => response.json())
        .then(data => {
            wordPairs = data;
            shuffleArray(wordPairs);
            loadQuestion();
        })
        .catch(error => console.error('Error fetching word pairs:', error));
}

// From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// This function is called when the priority checkbox for a word is changed
function togglePriority(event) {
    const word = wordPairs[currentQuestionIndex];
    const newPriority = event.target.checked ? 'high' : 'low';

    fetch(`/word/${word.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
    })
    .then(response => response.json())
    .then(data => {
        // Update the priority in the local wordPairs array
        word.priority = newPriority;
        //console.log('Priority updated for ${word.german}: ${newPriority}');
    })
    .catch(error => console.error('Error updating word priority:', error));
}

function filterPriority() {
    const showHighPriorityOnly = document.getElementById('filterPriorityCheckbox').checked;
    fetch('/words?priority=' + (showHighPriorityOnly ? 'high' : 'all'))
    .then(response => response.json())
    .then(data => {
        wordPairs = data;
        currentQuestionIndex = 0;
        shuffleArray(wordPairs);
        loadQuestion();
    })
    .catch(error => console.error('Error filtering words:', error));
}

function loadQuestion() {

    // Check whether we are done.
    if(currentQuestionIndex >= wordPairs.length) {
        alert("You've completed the quiz!");
        currentQuestionIndex = 0; // Optionally reset the quiz or navigate elsewhere
    }

    const question = wordPairs[currentQuestionIndex];
    // Since incorrect answers are separate, we directly create an array with all options
    const options = [question.correct, question.incorrect1, question.incorrect2, question.incorrect3];
    shuffleArray(options); // Shuffle the options to randomize their order

    document.getElementById("question").textContent = "(" + (currentQuestionIndex + 1) + "/" + wordPairs.length + ") " + question.german;
    const optionButtons = document.getElementsByClassName("option");
    for (let i = 0; i < optionButtons.length; i++) {
        if(options[i]){ // Check if the option exists
            optionButtons[i].style.display = ""; // Show button if it was previously hidden
            optionButtons[i].textContent = options[i];
            optionButtons[i].onclick = function() {
                checkAnswer(options[i] === question.correct, question.correct);
            };
        } else {
            optionButtons[i].style.display = "none"; // Hide any buttons that don't have an option
        }
    }

    // Update checkbox status based on the current word's priority
    var priorityCheckbox = document.getElementById('priorityCheckbox');
    if (priorityCheckbox) { // Check if the checkbox exists
        priorityCheckbox.checked = wordPairs[currentQuestionIndex].priority === 'high';
    } else {
        console.error('Priority checkbox not found');
    }
}

function checkAnswer(isCorrect, correctAnswer) {
    const resultElement = document.getElementById("result");
    if (isCorrect) {
        // Automatically load the next question if the answer is correct
        nextQuestion();
    } else {
        // Display "Incorrect!" and wait for the user to click "Next"
        resultElement.textContent = "Incorrect! " + correctAnswer;
    }
}

function nextQuestion() {
    currentQuestionIndex = (currentQuestionIndex + 1) % wordPairs.length;
    loadQuestion();
    document.getElementById("result").textContent = "";
}

// Call fetchWordPairs to start the quiz
window.onload = fetchWordPairs;

