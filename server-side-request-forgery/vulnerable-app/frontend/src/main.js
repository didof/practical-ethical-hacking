const form = document.getElementById('url-form');
const urlInput = document.getElementById('url-input');
const statusMessage = document.getElementById('status-message');

const API_ENDPOINT = 'http://localhost:8080/api/update-profile-picture';

const setStatus = (message, color) => {
  statusMessage.textContent = message;
  statusMessage.className = `text-center text-${color}-500`;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();

  if (!url) {
    setStatus('Please enter a URL.', 'yellow');
    return;
  }

  setStatus('Sending request to server...', 'yellow');

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Server responded with status ${response.status}`);
    }
    
    setStatus('Success! The server fetched the URL.', 'green');

  } catch (error) {
    setStatus(`Error: ${error.message}`, 'red');
  }
});