const button = document.querySelectorAll('cds-button');
const submitButton = document.getElementsByClassName('textblock')
const bar = document.querySelector('cds-progress-bar');
const domain = 'nkalley-ideashelf-production-1.gateway-nookalley.workers.dev'

var input = document.getElementById("cds-search")

var svg = `<svg class="cds-button-icon" width="16" height="16" viewBox="0 0 16 16"xmlns="http://www.w3.org/2000/svg">+<path d="M7 7H4v2h3v3h2V9h3V7H9V4H7v3zm1 9A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" fill-rule="evenodd" /></svg>`
var svgSecondary = `<svg class="cds-button-icon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">+<path d="M7 7H4v2h3v0h2V9h3V7H9H7m1 9A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" fill-rule="evenodd"></path></svg>`

button.forEach(button => {
    button.addEventListener('click', () => {
        // Toggle the kind attribute between "primary" and "secondary"
        if (button.getAttribute('kind') === 'primary') {
            button.setAttribute('kind', 'secondary');
            button.innerHTML = `${svgSecondary}&nbsp&nbsp&nbsp Added`
        } else {
            button.setAttribute('kind', 'primary');
            button.innerHTML = `${svg}&nbsp&nbsp&nbsp Add to list`
        }
    });
});

function failLoad(failCode) {
    var failReason = ["Unknown error", "Unable to contact server", "Server is closed at the moment", "Failed to authorize with server", "Failed to tally votes", "Server could not count votes", "Server did not recive votes"]
    var failBlame = ["", "Network error", "", "Please contact User Support", "Please contact User Support", "Please contact User Support", "Network Error"]
    bar.setAttribute('helper-text', `${failReason[failCode]}`);
    bar.setAttribute('status', `error`);
}

async function testConnection() {
    bar.setAttribute('status', `active`);
    bar.setAttribute('helper-text', `Contacting the server...`);

    try {
        const response = await fetch(`//${domain}/check`);
        if (response.status !== 200) {
            console.log(`Looks like there was a problem. Status Code: ${response.status}`);
            failLoad(1); // Failed to contact server
            throw new Error("Failed to contact server")
        }
    } catch {
        failLoad(1); // Failed to contact server
        throw new Error("Failed to contact server")
    }

    bar.setAttribute('value', `16.666666667`);
    bar.setAttribute('helper-text', `Checking the server...`);

    try {
        const statusResponse = await fetch(`//${domain}/status`);
        const data = await statusResponse.json();
        if (data.code === '200') {
            return;
        } else {
            failLoad(2); // Server is closed
            throw new Error("Server Closed")
        }
    } catch {
        failLoad(2); // Server is closed
        throw new Error("Server Closed")
    }
}

async function authorize() {
    try {
        if (typeof (Storage) !== "undefined") {
            // No Auth Key exists
            bar.setAttribute('value', `50.000000001`);
            bar.setAttribute('helper-text', `Requesting Authorization...`);

            try {
                const options = { method: 'POST' };
                const response = await fetch(`https://${domain}/auth/register?AppVersion=${navigator.appVersion}&Platform=${navigator.platform}&UserAgent=${navigator.userAgent}&Vendor=${navigator.vendor}`, options);
                const data = await response.json();
                localStorage.setItem("authKey", data.authKey); // Set key from server to localStorage
                // Fully Authorized
            } catch {
                failLoad(3) // Failed to authorize with server
                throw new Error("Failed to authorize with server")
            }
        } else {
            alert('Web Storage failed, support or permission issue');
            failLoad() // WebStorage error
            throw new Error("Web Storage Failure!")
        }
    } catch (err) {
        failLoad(3) // Failed to authorize with server
        console.error('Error during authorization:', err);
        throw new Error("Failed to authorize with server")
    }
}

async function tally() {
    try {
        // Loop through each button and set disabled to true
        button.forEach(button => {
            button.disabled = true;
        });

        let votes = [];
        let buttons = document.getElementsByTagName('cds-button');

        for (let button of buttons) {
            // Check if the button has the 'primary' class
            if (button.getAttribute('kind') === 'secondary') {
                votes.push(1); // If it's selected, add 1
            } else {
                votes.push(0); // If it's unselected, add 0
            }
        }
        votes.shift();
        return localStorage.setItem("tally", votes); // Set key from server to localStorage
    } catch {
        failLoad(4) // Failed to tally votes
        throw new Error("Failed to tally votes")
    }
}

async function submit() {
    window.location = '#top'
    submitButton[0].style.display = 'none';
    submitButton[1].style.display = 'none';
    bar.setAttribute('style', `display: block;`);
    bar.setAttribute('status', `active`);
    bar.setAttribute('helper-text', `Testing connection...`);
    try { await testConnection() } catch { return }
    bar.setAttribute('value', `33.333333334`);
    bar.setAttribute('helper-text', `Getting logged in...`);
    try { await authorize() } catch { return }
    bar.setAttribute('value', `66.666666668`);
    bar.setAttribute('helper-text', `Recording Votes...`);
    try { await tally() } catch { return }
    bar.setAttribute('value', `83.333333335`);
    bar.setAttribute('helper-text', `Submitting Votes...`);

    try {
        const options = { method: 'POST' };
        const response = await fetch(`https://${domain}/voting/submit?AuthKey=${localStorage.getItem("authKey")}&Votes=${localStorage.getItem("tally")}&Key=77miso`, options)
        const data = await response.json();
        console.log(data)
        if (data.code === "202") {
            bar.setAttribute('value', `100`);
            bar.setAttribute('status', `finished`);
            bar.setAttribute('helper-text', `Your Votes Have Been Received`);
        } 
        else {
            failLoad(5) // Server did not record votes
        }
    } catch {
        failLoad(6) // Server did not recive votes
    }

}

// Search Function 
function search() {
    var elements = document.getElementsByTagName('cds-tile')
    var items = document.getElementsByClassName("item")
    length = elements.length - 1
    let currentPoint = -1;
    function validity() {
        if (elements[currentPoint].innerHTML.includes(input.value)) {
            items[currentPoint].style.display = 'block';
        } else {
            items[currentPoint].style.display = 'none';
            return;
            //return console.log(`${currentPoint} does not contain ${input.value}`)
        }
    }
    async function searchInternal() {
        if (currentPoint < length) {
            currentPoint = currentPoint + 1
            await validity()
            searchInternal()
        } else {
            return;
        }
    }
    searchInternal()
}
input.addEventListener('input', search);


/*
const size = 200;
    let progress = 0;
    setTimeout(() => {
      const bar = document.querySelector('cds-progress-bar');
      const interval = setInterval(() => {
        const advancement = Math.random() * 3;
        if (progress + advancement < size) {
          progress = progress + advancement;
          bar.setAttribute('value', `${progress}`);
          bar.setAttribute('helper-text', `${progress.toFixed(1)}MB of ${size}MB`);
        } else {
          clearInterval(interval);
          bar.setAttribute('value', `${size}`);
          bar.setAttribute('status', `finished`);
          bar.setAttribute('helper-text', 'Done');
        }
      }, 50);
    }, 3000);*/