export function setupAudioButtons() {
  Array.from(document.getElementsByClassName("audio-button")).forEach(
    (button) => {
      button.onclick = audioButtonHandler;
    }
  );
}

function audioButtonHandler(event) {
  const button = event.target;

  const audioId = button.getAttribute("data-audio-id");
  const audio = document.getElementById(audioId);

  const icon = button.querySelector("i");

  if (audio.paused) {
    audio.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  } else {
    audio.pause();
    icon.classList.add("fa-play");
    icon.classList.remove("fa-pause");
  }
}
