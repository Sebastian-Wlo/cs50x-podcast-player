/* Find the HTML elements in DOM by their id, assign them to constans for manipulation via script */
// Audio player controls
const playButton = document.getElementById("play");
const forwardButton = document.getElementById("forward-15s");
const backButton = document.getElementById("back-15s");
const playerProgressSlider = document.getElementById("player-progress");

const volumeSlider = document.getElementById("volumeSlider");
const volumeDisplay = document.getElementById("volumePercent");
// Episode list controls
const sortOrderButton = document.getElementById("sort-order-button");

// Available podcasts list display element (unordered list)
const podcastListHTML = document.getElementById("podcasts-list");
// Selected podcast's episode list display element (unordered list)
const episodeListHTML = document.getElementById("episode-list");
// Audio player display elements
const displayTime = document.getElementById("time");
const episodeTime = document.getElementById("time-whole");
const titleText= document.getElementById("title-text");
const playerTitleText = document.getElementById("player-title-text");
const playerImage = document.getElementById("player-img")

// Details row:
const detailsTitle = document.getElementById("details-header-title");
const detailsAuthor = document.getElementById("details-header-author");
const detailsDescription = document.getElementById("details-header-description");
const detailsImage = document.getElementById("details-header-image")
const detailsPublished = document.getElementById("details-header-publisheddate");
const detailsPlayButton = document.getElementById("details_playbutton");
const episodeListDiv = document.getElementById("episode-list-div");

const showMoreButton = document.getElementById("show-more-button");
let episodeDescription = ["", ""];
let showingFullDescription = false;
let selectedPodcastImage = "";
//Details row-end


/* Declare control logic variables */
// Episodes list control variables
let sortDescending = false;
let onlyListened = false;

let audioPlaying = false;
let sliderMovedByUser = false;
let selectedEpisode = null;
// Storing podcasts and episodes lists (arrays)
let podcastsArray = [];
let episodesArray = [];
// Set the play udate refresh rate: 
let refreshRate = setInterval(timeUpdate, 250);

let audioUrl = "";
let userData = {
    recentlyPlayedPodcast: null, // get which podcast was played the last time the user opened the page, or, if this is the first time they visit, leave it as null 
    currentEpisodeTimestamp: 0,
    currentEpisodePlaying: null,
    currentEpisodeDuration: 0,
    currentEpisodeData: {}
}

// Declare a new Audio HTML element
const audio = new Audio();
audio.volume = 0.8;


/* Bootstrap: enable tooltips */
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

/* Server calls */
// Get list of podcasts, store the received data in the "podcastsArray" array, call the element creating function
async function get_podcasts() {
    fetch(`/get_podcast_list`,
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            
            podcastsArray = response;
            displayListInHtml(podcastsArray, podcastListHTML)
        })
        .catch(error => {
            console.log("Something went wrong. couldn't generate podcast list.")
        })
}

// Get list of episodes, store the received data in the "episodesArray" array, call the element creating function
async function get_episodes(podcast_id) {
    fetch(`/get_episodes/podcast_id/${podcast_id}`,
        {
            method: "GET",
        })
        .then(response => response.json())
        .then(response =>{
            
            // Clear up both  
            episodesArray = response
            sortEpisodes();
            displayListInHtml(episodesArray, episodeListHTML)
            // Rewind the list back to top
            episodeListDiv.scrollTop = 0;
            return episodesArray
        })
        .catch(error => {
            console.log("Something went wrong. couldn't fetch episode list.")
        })
}

/* List constructing functions */
const displayListInHtml = (list, htmlList) => {
    // Clear up the list
    while (htmlList.hasChildNodes()) {
        htmlList.removeChild(htmlList.firstChild)
    }
    for (i = 0; i < list.length; i++) {
        // Create a new common list element, its children, build the element's structure, add id and classes:
        const listElement = document.createElement("li");
        const listElementContainer = document.createElement("div");
        const listElementImageColumn = document.createElement("div");
        const listElementTextColumn = document.createElement("div");
        const listElementImage = document.createElement("img");
        const listElementTitle = document.createElement("h4");
        const listElementAuthor = document.createElement("p");

        listElement.appendChild(listElementContainer);
        listElementContainer.appendChild(listElementImageColumn);
        listElementContainer.appendChild(listElementTextColumn);
        listElementImageColumn.appendChild(listElementImage);
        listElementTextColumn.appendChild(listElementTitle);
        listElementTextColumn.appendChild(listElementAuthor);

        listElement.classList.add("rounded-4");
        listElementContainer.classList.add("row");
        listElementImageColumn.classList.add("col-auto", "align-items-center");
        listElementTextColumn.classList.add("col", "align-content-center");
        listElementImage.classList.add("rounded-3", "m-2");
        listElementAuthor.classList.add("gray-text");

        listElementTitle.innerText = list[i]["title"];
        listElementAuthor.innerText = list[i]["author"];

        // Check try adding the image, add default if it fails:
        if (list[i]["coverimage"] == null) {
            if (selectedPodcastImage == null) {
                listElementImage.src = "./static/default_image.jpg";
            }
            else {
                listElementImage.src = selectedPodcastImage;
            }
        } else {
            listElementImage.src = list[i]["coverimage"];
        }
        listElementImage.alt = `Cover image for ${list[i]["title"]}`;
        listElementImage.height = 80;

        listElementContainer.classList.add(`${String(htmlList.id)}-item`)
        listElement.setAttribute("id", `${String(htmlList.id)}_${list[i]["id"]}`);
        htmlList.appendChild(listElement)
        // Add details for the specific list being filled (podcasts or episodes) and event listeners to both lists:
        if (list === episodesArray) {
            const listElementDescription = document.createElement("p");
            const listElementPodcastEpisodePanel = document.createElement("div");
            const pubDateColumn = document.createElement("div");
            pubDateColumn.classList.add("col-2");
            const durationColumn = document.createElement("div");
            durationColumn.classList.add("col-2");
            const playButtonColumn = document.createElement("div");
            playButtonColumn.classList.add("col-8");
            const listElementPublicationDate = document.createElement("p");
            const listElementPodcastDuration = document.createElement("p");
            const listElementPlayPodcast = document.createElement("button");
            listElementTextColumn.appendChild(listElementDescription);
            listElementTextColumn.appendChild(listElementPodcastEpisodePanel);
            listElementPodcastEpisodePanel.appendChild(pubDateColumn);
            pubDateColumn.appendChild(listElementPublicationDate);
            listElementPodcastEpisodePanel.appendChild(durationColumn)
            durationColumn.appendChild(listElementPodcastDuration);
            playButtonColumn.appendChild(listElementPlayPodcast);
            listElementPodcastEpisodePanel.appendChild(playButtonColumn);
            listElementDescription.classList.add("gray-text");
            listElementPublicationDate.classList.add("bold-text");
            listElementPodcastEpisodePanel.classList.add("row");
            listElementDescription.innerHTML = list[i]["description"];
            listElementPublicationDate.innerText = `Released: ${list[i]["publication_date"]}`;
            listElementPodcastDuration.innerText = `Duration:  ${list[i]["duration"]}`;
            console.log(list[i])
            listElementPlayPodcast.classList.add("btn", "btn-primary")
            listElementPlayPodcast.innerHTML = 'Play episode <i class="fa fa-play" aria-hidden="true"></i>';
            
            listElementPlayPodcast.addEventListener("click", () =>{
                for (n = 0; n < list.length; n++) {
                    if (episodesArray[n]["id"] === Number(listElement.id.split("_")[1])) {
                        userData["currentEpisodeData"] = episodesArray[n]
                        setUpPlayer(episodesArray[n])
                    }
                }
                
            })
        } else {
            listElementAuthor.innerText = list[i]["author"];
        }
        // Add the element functionality:
        listElementContainer.addEventListener("click", () => {
            list_element_onclick(listElementContainer, htmlList, listElement.id);
        })
    }
};
//
const list_element_onclick = (element, htmlList, idNumber) => {
    const id = Number(idNumber.split("_")[1])
    //const listName = idNumber.split("_")[0]
    //change highlited element
    const temp = document.querySelectorAll(`.selected-list-entry.${htmlList.id}-item`)
    for (i = 0; i < temp.length; i++) {
        temp[i].classList.remove("selected-list-entry")
    }
    element.classList.add("selected-list-entry")

    //Add element action depending on which list the element belongs to:
    if (htmlList.id === "podcasts-list") {
        //If the element is on the Podcast List, load podcast details to the preview
        for (i = 0; i < podcastsArray.length; i++) {
            if (podcastsArray[i]["id"] === id) {
                //userData.currentEpisodeAuthor = podcastsArray[i]["author"]
                get_episodes(id)
                set_description(podcastsArray[i])
            }
        }
    } else {
    //If th
        for (i = 0; i < episodesArray.length; i++) {
            
            if (episodesArray[i]["id"] === id) {
            userData.currentEpisodeData = podcastsArray[i]
            set_description(episodesArray[i])
            episodeListDiv.scrollTop = 0;
            }
        }

    }
};

const set_description = (arr) => {
    showMoreButton.innerHTML = 'Show full description';
    // Only Podcast episodes have "audio_url" keys, so we can use that to determine which array was sent
    if (!arr["audio_url"]){

        detailsTitle.innerText = arr["title"];
        detailsImage.src = arr["coverimage"];
        selectedPodcastImage = arr["coverimage"];
        detailsAuthor.innerText = arr["author"];
        detailsDescription.innerText = arr["description"]
        detailsPlayButton.style.visibility = "hidden";
        showMoreButton.style.visibility = "hidden";

    } else {
        
        detailsTitle.innerText = arr["title"];
        //detailsImage.src = arr["coverimage"];
        detailsAuthor.innerText = arr["author"];
        detailsDescription.innerHTML = arr["description"]
        detailsPublished.innerHTML = `Released: ${arr["publication_date"]}`
        detailsPlayButton.style.visibility = "visible";
        selectedEpisode = arr;

        if (arr["description_full"] !== "") {
            episodeDescription[0] = arr["description"];
            episodeDescription[1] = arr["description_full"];
            showingFullDescription = false;
            showMoreButton.style.visibility = "visible";
        }
        else {
            episodeDescription = ["", ""];
            showMoreButton.visibility = "hidden";
            showingFullDescription = true;
        }
    }
}

const setUpPlayer = (currentEpisode) => {
    audioPlaying = false;
    playButton.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
    displayTime.innerText = "00:00:"
    audio.src = currentEpisode["audio_url"];
    audio.onloadedmetadata = function() {
        userData.currentEpisodeDuration = audio.duration;
        userData.currentEpisodeData = currentEpisode;
        titleText.innerText = currentEpisode["title"];
        titleText.setAttribute("title", `<h6>${currentEpisode["title"]}</h6>`)
        titleText.setAttribute("data-bs-original-title",`<h6>${currentEpisode["title"]}</h6>`)
        playerTitleText.innerHTML = currentEpisode["author"];
        if (selectedPodcastImage == null) {
            playerImage.src = "./static/default_image.jpg"
        } else {
            playerImage.src = selectedPodcastImage;
        }
        
        episodeTime.innerText = convertTimeFromSeconds(Math.floor(userData["currentEpisodeDuration"]))

        //player progress bar setup
        playerProgressSlider.setAttribute("min", 0)
        playerProgressSlider.value = playerProgressSlider.getAttribute("min");
        playerProgressSlider.setAttribute("max", Math.floor(audio.duration));
        startPlayback();

    }

}

playButton.addEventListener("click", () => {
    startStopPlayback()
})
const startStopPlayback = () => {
    if (audio.src) {
        if (audioPlaying === true)
            {
                audioPlaying = false;
                playButton.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i>';
                userData.currentEpisodeTimestamp = audio.currentTime;
                audio.pause()
            }
            else
            {
                startPlayback()
            }
    }
} 

const startPlayback = () => {
    if (audio.src) {
        audioPlaying = true;
        playButton.innerHTML = '<i class="fa fa-pause" aria-hidden="true"></i>';
        audio.play();
    }
}

const sortEpisodes = () => {
    if (!sortDescending) {
        episodesArray.sort((a, b) => b["id"] - a["id"]);
    }
    else {
        episodesArray.sort((a, b) => a["id"] - b["id"]);
    }
}

const toggleEpisodeOrder = () => {
    if (!sortDescending) {
        sortOrderButton.innerHTML = `Order: <i class="fa fa-arrow-down" aria-hidden="true"></i>`;
    }
    else {
        sortOrderButton.innerHTML = `Order: <i class="fa fa-arrow-up" aria-hidden="true"></i>`;
    }
    sortDescending = !sortDescending;
    sortEpisodes()
    displayListInHtml(episodesArray, episodeListHTML)

}

sortOrderButton.addEventListener("click", () => {
    toggleEpisodeOrder()
})

forwardButton.addEventListener("click", () => {
    if (!isNaN(userData.currentEpisodeDuration) && audio.currentTime + 15 <= userData.currentEpisodeDuration)
        audio.currentTime = Math.floor(audio.currentTime) + 15
    else audio.currentTime = userData.currentEpisodeDuration
})


backButton.addEventListener("click", () => {
    if (!isNaN(userData.currentEpisodeDuration) && audio.currentTime - 15 >= 0)
        audio.currentTime = Math.floor(audio.currentTime) - 15;
    else audio.currentTime = 0;
})

playerProgressSlider.addEventListener("mousedown", () => {
    sliderMovedByUser = true;
    let val = playerProgressSlider.value
    audio.currentTime = val;
})
playerProgressSlider.addEventListener("mouseup", () => {
    sliderMovedByUser = false;
    let val = playerProgressSlider.value;
    audio.currentTime = val;
})

detailsPlayButton.addEventListener("click", () => {
    setUpPlayer(selectedEpisode)
})

showMoreButton.addEventListener("click", () =>{
    if (!showingFullDescription) {
        detailsDescription.innerHTML = episodeDescription[1]
        showMoreButton.innerHTML = 'Hide description';
    } else {
        detailsDescription.innerHTML = episodeDescription[0]
        showMoreButton.innerHTML = 'Show full description';
        episodeListDiv.scrollTop = 0;
    }
    showingFullDescription = !showingFullDescription;
})

window.onload = function () {
    detailsPlayButton.style.visibility = "hidden";
    // After Page loads, ask for the episodes of the first podcast on the list:
    get_podcasts()
    //get_episodes(1)

}
const convertTimeFromSeconds = (inputSeconds) => {
    let displayHours = 0
    let displayMinutes = 0
    let displaySeconds = 0
    var displayTimeString = ""

    displayHours = Math.floor((inputSeconds / 3600))
    displayMinutes = Math.floor((inputSeconds - displayHours * 3600) / 60)
    displaySeconds = Math.floor(inputSeconds - (displayHours * 3600) - (displayMinutes * 60))

    if (displayHours < 1) {
        displayTimeString = `${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`
    } else {
        displayTimeString = `${displayHours.toString()}:${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`
    }

    return displayTimeString
}
document.body.onkeyup = function(keyPressed) {
    if (keyPressed.keyCode == 32) {
        document.activeElement.blur();
        startStopPlayback();
    } 
}
function timeUpdate() {
    
    if (audioPlaying) {
        if (audioPlaying) {
            displayTime.innerText = convertTimeFromSeconds(Math.floor(audio.currentTime));
        }
        
        //displayTime.innerText = `${seconds}`;
        if( sliderMovedByUser === false){
            playerProgressSlider.value =  Math.floor(audio.currentTime)
        }
    }
    volumeDisplay.innerHTML = `${volumeSlider.value}%`;
    audio.volume = volumeSlider.value / 100
}