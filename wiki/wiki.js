const wikiEntries = [
  {
    type: "item",
    name: "Healing Potion",
    text: "Restores 3 health when used.",
    media: "healing-potion.png",
    mediaType: "image",
  },
  {
    type: "enemy",
    name: "Skeleton Archer",
    text: "Fires arrows from a distance. Moves away when approached.",
    media: "skeleton-archer.webm",
    mediaType: "video",
  },
  {
    type: "weapon",
    name: "Boomerang Blade",
    text: "",
    media: "boomerang-blade.webm",
    mediaType: "video",
  },
  {
    type: "info",
    name: "Mystery Stone",
    text: "No known information.",
    media: "",
    mediaType: "",
  },
];

const container = document.getElementById("wiki-container");

wikiEntries.forEach((entry) => {
  const entryDiv = document.createElement("div");
  entryDiv.className = "wiki-entry";

  if (entry.media) {
    const mediaDiv = document.createElement("div");
    mediaDiv.className = "wiki-media";

    if (entry.mediaType === "image") {
      const img = document.createElement("img");
      img.src = entry.media;
      img.alt = entry.name;
      mediaDiv.appendChild(img);
    } else if (entry.mediaType === "video") {
      const video = document.createElement("video");
      video.src = entry.media;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      mediaDiv.appendChild(video);
    }

    entryDiv.appendChild(mediaDiv);
  }

  if (entry.text || entry.name) {
    const textDiv = document.createElement("div");
    textDiv.className = "wiki-text";

    if (entry.name) {
      const h2 = document.createElement("h2");
      h2.textContent = entry.name;
      textDiv.appendChild(h2);
    }

    if (entry.text) {
      const p = document.createElement("p");
      p.textContent = entry.text;
      textDiv.appendChild(p);
    }

    entryDiv.appendChild(textDiv);
  }

  container.appendChild(entryDiv);
});
