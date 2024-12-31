/* Common Page elements */
const nameInput = document.getElementById("name");
const pswrdInput = document.getElementById("password");

const pswrdRepeat = document.getElementById("pswrd_rpt");
const submitButton = document.getElementById("submit-button");

const nameResponse = document.getElementById("name-response");
const pswrdResponse = document.getElementById("password-response");
const repeatResponse = document.getElementById("repeat-response");

const adminPodcastList = document.getElementById("podcasts-list");

let pageRegister = false
if (pswrdRepeat !== null){
    pageRegister = true
}

/* Generate a list of podcasts, include a button to remove them from database */
async function get_response_register() {
    fetch(`/register`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                "name": nameInput.value,
                "password": pswrdInput.value,
                "pswrd_rpt": pswrdRepeat.value
            })
        })
        .then(response => response.json())
        .then(response =>{
            let fieldsOk = 0 
            const response_message = response

            if (response_message["username"].length !== 0) {
                nameResponse.innerText = response_message["username"];
                nameResponse.classList.add("text-danger");
            }
            else {
                nameResponse.innerText = "This name is available!";
                nameResponse.classList.remove("text-danger");
                fieldsOk += 1
            }
            if (response_message["password"].length !== 0) {
                pswrdResponse.innerText = response_message["password"]
                pswrdResponse.classList.add("text-danger");                    
            }
            else {
                pswrdResponse.innerText = ""
                fieldsOk +=1
            }                
            if (response_message["repeat"].length !== 0) {
                repeatResponse.innerText = response_message["repeat"]
                repeatResponse.classList.add("text-danger");
            }
            else {
                repeatResponse.innerText = ""
                fieldsOk += 1
            }
            if (fieldsOk === 3) {
                window.location.replace("/")
            }
            return response
        })
        .catch(error => {
            console.log("Something went wrong.", error)
        })
}

async function get_response_login(id) {
        fetch("/ login",
            {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    "name": nameInput.value,
                    "password": pswrdInput.value,
                })
            })
}

submitButton.addEventListener("click", () => {
    event.preventDefault();
    if (pageRegister == true) {
        get_response_register();
    }
})
window.onload = function () {
}
