/* Admin page scripts */
const adminPodcastList = document.getElementById("podcasts-list");
const adminUserList = document.getElementById("admin-user-list");
const forceUpdate = document.getElementById("force-update");
const lastUpdate = document.getElementById("last-update")

let myId = null;
/* Generate a list of podcasts, include a button to remove them from database */
async function get_podcasts() {
    fetch(`/get_podcast_list`,
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            for (i = 0; i < response.length; i++){

                const newPodcastListElement = document.createElement("li");
                adminPodcastList.appendChild(newPodcastListElement);
                newPodcastListElement.classList.add("list-group-item", "bg-dark", "px-0", "py-1")

                const podcastListDiv = document.createElement("div");
                newPodcastListElement.appendChild(podcastListDiv);
                podcastListDiv.classList.add("row", "text-white", "bg-dark");

                const podcastListDataCol = document.createElement("div");
                podcastListDiv.appendChild(podcastListDataCol);
                podcastListDataCol.classList.add("col")
                
                const row1 = document.createElement("div");
                podcastListDataCol.appendChild(row1);
                row1.classList.add("row", "py-1");

                // Podcast Image
                const imageColumn = document.createElement("div");
                row1.appendChild(imageColumn);
                imageColumn.classList.add("col-auto");

                const podcastImage = document.createElement("img");
                imageColumn.appendChild(podcastImage)
                podcastImage.height = 100;
                podcastImage.src = response[i]["coverimage"];
                podcastImage.alt = `${response[i]["title"]} Logo`;

                // Podcast Name and Author
                const textColumn = document.createElement("div");
                row1.appendChild(textColumn);
                textColumn.classList.add("col");
                
                const textRow1 = document.createElement("div");
                textColumn.appendChild(textRow1);
                textRow1.classList.add("row", "py-3");

                const podcastTitle = document.createElement("h4");
                textRow1.appendChild(podcastTitle);
                podcastTitle.classList.add("wrapText");
                podcastTitle.innerText = response[i]["title"];

                const podcastAuthor = document.createElement("p");
                textColumn.appendChild(podcastAuthor);
                podcastAuthor.classList.add("wrapText");
                podcastAuthor.innerText = response[i]["author"];

                const detailsRow = document.createElement("div");
                podcastListDataCol.appendChild(detailsRow);
                detailsRow.classList.add("row", "py-1", "px-0");

                const spacer = document.createElement("div");
                detailsRow.appendChild(spacer);
                spacer.classList.add("col-auto", "spacer100px");

                const episodesCountCol = document.createElement("div");
                detailsRow.appendChild(episodesCountCol);
                episodesCountCol.classList.add("col-md-3");

                const episodeNumberText = document.createElement("p");
                episodesCountCol.appendChild(episodeNumberText);
                episodeNumberText.innerHTML = `<b>Episodes:</b> ${response[i]["episodeCount"]}`;

                const latestEpisodeCol = document.createElement("div");
                detailsRow.appendChild(latestEpisodeCol);
                latestEpisodeCol.classList.add("col-md-6");

                const latestEpisode = document.createElement("p");
                latestEpisodeCol.appendChild(latestEpisode);
                latestEpisode.innerHTML =  `<b>Latest Episode:</b> ${response[i]["latestUpload"]}`;
                
                const removeButtonColumn = document.createElement("div");
                podcastListDiv.appendChild(removeButtonColumn);
                removeButtonColumn.classList.add("col-auto", "px-0");

                const removePodcastButton = document.createElement("button");
                removeButtonColumn.appendChild(removePodcastButton);
                removePodcastButton.value = response[i]["id"];
                removePodcastButton.classList.add("removePodcast", "btn", "btn-danger");
                removePodcastButton.innerHTML = `<i class="fa fa-trash" aria-hidden="true"></i>`

                // Add event listeners for buttons, hook them up to the server call to remove podcasts
                removePodcastButton.addEventListener("click", () => {
                    
                    remove_podcast(removePodcastButton.value);
                })
            }

            return response
        })
        .catch(error => {
            console.log("Something went wrong. couldn't generate podcast list.")
        })
}

async function remove_podcast(id) {
    fetch("/remove_podcast",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ "podcast_id": id })
        })
        console.log(`sent call to remove ${id} from the database`)
           // Clear all childern of the list element
        while (adminPodcastList.firstChild) {
            adminPodcastList.removeChild(adminPodcastList.lastChild);
        }
           get_podcasts();
}

async function get_self() {
    fetch("/get_self",
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            myId = response;
            return myId
        })
        .catch(error => {
            console.log("Something went wrong. couldn't get own id.")
        })
}

async function get_users() {
    fetch("/get_user_list",
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            while (adminUserList.hasChildNodes()) {
                adminUserList.removeChild(adminUserList.firstChild);
            }
            
            for (i = 0; i < response.length; i++){
            
                const user = document.createElement("tr")
                user.innerHTML = `
                <th scope="row">${response[i]["id"]}</th>
                <td>${response[i]["username"]}</td>`

                const tableColumn = document.createElement("td");
                adminUserList.appendChild(user);
                const adminRoleCheck = document.createElement("button");
                adminRoleCheck.id = `rolecheck-${response[i]["id"]}`
                if (response[i]["role"] === 1) {
                    adminRoleCheck.innerHTML = `<i class="fa fa-wrench" aria-hidden="true"></i>`;
                    adminRoleCheck.classList.add("btn", "btn-primary")
                }
                else {
                    adminRoleCheck.innerHTML = `<i class="fa fa-user-circle" aria-hidden="true"></i>`;
                    adminRoleCheck.classList.add("btn", "btn-secondary")
                }
                
                adminRoleCheck.addEventListener("click", () => {
                    change_user_role(adminRoleCheck.id.split("-")[1]);
                })
                user.appendChild(tableColumn);
                tableColumn.appendChild(adminRoleCheck);
                
                const dateColumn = document.createElement("td");
                dateColumn.innerHTML = `${response[i]["registered"]}`;
                user.appendChild(dateColumn);

                const removeUserBtn = document.createElement("button");
                removeUserBtn.type = "button";
                removeUserBtn.classList.add("btn", "btn-danger");
                removeUserBtn.id = `removeUser-${response[i]["id"]}`
                removeUserBtn.innerHTML = `<i class="fa fa-user-times" aria-hidden="true"></i>`;
                const removeColumn = document.createElement("td");
                removeColumn.appendChild(removeUserBtn);
                user.appendChild(removeColumn);
                console.log(myId)
                if (myId == removeUserBtn.id.split("-")[1]) {
                    removeUserBtn.disabled = true;
                    adminRoleCheck.disabled = true;
                }
                removeUserBtn.addEventListener("click", () => {
                   remove_user(removeUserBtn.id.split("-")[1]);
                })
            }
        })
        .catch(error => {
            console.log("Something went wrong. couldn't generate user's list.")
        })
}

async function change_user_role(id) {
    fetch("/change_user_role",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ "user_id": id })
        }).then(response => {
            console.log(`sent call to change a role for user with id number: ${id}`)
            get_users();
        })
}

async function remove_user(id) {
    fetch("/remove_user",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ "user_id": id })
        }).then(response =>{
            console.log(`sent call to remove user with id number: ${id} from the database`)
            get_users();

        })
}
async function get_last_update() {
    fetch("/get_last_update",
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            console.log(response)
            lastUpdate.innerHTML = `Last episodes database update: ${response}`;
            return response
        })
        .catch(error => {
            console.log("Something went wrong. couldn't get an update.")
        })
}
async function force_update() {
    fetch("/update_episodes_db",
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            lastUpdate.innerHTML = `Last episodes database update: ${response["updated"]}`;
            return response
        })
        .catch(error => {
            console.log("Something went wrong. couldn't Force an update.")
        })
}

forceUpdate.addEventListener("click", () => {
    force_update();
})

window.onload = function () {
    get_self();
    get_podcasts();
    get_users();
    get_last_update();
    
}