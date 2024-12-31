const oldPassword = document.getElementById("old-password");
const newPassword = document.getElementById("new-password");
const repeatPassword = document.getElementById("repeat-password");

const deletePassword = document.getElementById("delete-password");
const deleteResponse = document.getElementById("delete-response");

const submitNewPassButton = document.getElementById("submit-password-change-button");
const deleteaccountButton = document.getElementById("delete-account-button");

const oldPasswordResponse = document.getElementById("old-password-response");
const passwordResponse = document.getElementById("new-password-response");
const repeatResponse = document.getElementById("repeat-response");


/* Generate a list of podcasts, include a button to remove them from database */
async function get_response_change_password() {
    fetch("/change_password",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                "old_password": oldPassword.value,
                "new_password": newPassword.value,
                "repeat_password": repeatPassword.value
            })
        })
        .then(response => response.json())
        .then(response =>{
            console.log(response)
            let fieldsOk = 0 
            const response_message = response
            if (response_message["old_password"].length !== 0) {
                oldPasswordResponse.innerText = response_message["old_password"];
                oldPasswordResponse.classList.add("text-danger");
            }
            else {
                oldPasswordResponse.innerText = "Password checks out!";
                oldPasswordResponse.classList.remove("text-danger");
                fieldsOk += 1
            }
            if (response_message["new_password"].length !== 0) {
                passwordResponse.innerText = response_message["new_password"]
                passwordResponse.classList.add("text-danger");                    
            }
            else {
                passwordResponse.innerText = ""
                fieldsOk +=1
            }                
            if (response_message["repeat_password"].length !== 0) {
                repeatResponse.innerText = response_message["repeat_password"]
                repeatResponse.classList.add("text-danger");
            }
            else {
                repeatResponse.innerText = ""
                fieldsOk += 1
            }
            console.log(fieldsOk)
            if (fieldsOk === 3) {
                window.location.replace("/user_settings")
            }
            return response
        })
        .catch(error => {
            console.log("Something went wrong.", error)
        })
}
async function delete_this_account() {
    fetch("/delete_account",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                "delete_password": deletePassword.value,
            })
        })
        .then(response => response.json())
        .then(response =>{
            console.log(response)
            const response_message = response
            if (response_message["delete_password"].length !== 0) {
                deleteResponse.innerText = response_message["delete_password"];
                deleteResponse.classList.add("text-danger");
            }
            else {
                window.location.replace("/logout")
            }

            return response
        })
        .catch(error => {
            console.log("Something went wrong.", error)
        })
}

submitNewPassButton.addEventListener("click", () => {
    event.preventDefault();
    get_response_change_password();
})

deleteaccountButton.addEventListener("click", () => {
    event.preventDefault();
    delete_this_account();
})

window.onload = function () {
}
