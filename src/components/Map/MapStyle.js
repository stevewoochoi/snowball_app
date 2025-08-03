// src/components/Map/MapStyle.js
const BASEMAPS = {
  carto: {
    name: "CARTO",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  carto_dark: {
    name: "Carto Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  carto_light: {
    name: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  humanitarian: {
    name: "Humanitarian",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Humanitarian'
  },
  cycle: {
    name: "CyclOSM",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.cyclosm.org/">CyclOSM</a>'
  },
  topo: {
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> (CC-BY-SA)'
  }
//   positron: {
//     name: "Carto Positron",
//     url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
//     attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
//   },
//   darkmatter: {
//     name: "Carto Dark Matter",
//     url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
//     attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
//   }
};

export default BASEMAPS;