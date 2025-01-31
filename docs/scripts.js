// Register API call
function register() {
    const username = document.getElementById('username-field').value;
    const password = document.getElementById('password-field').value;

    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    });
}

// Login API call
function login() {
    const username = document.getElementById('username-field').value;
    const password = document.getElementById('password-field').value;

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = { username };
            document.getElementById('thread-username').value = username;
            document.getElementById('logout-btn').style.display = 'inline';
            alert('Login successful!');
        } else {
            alert('Invalid username or password.');
        }
    });
}

